import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class QuotaManager:
    MAX_DAILY_QUOTA: int = 10000
    PAUSE_THRESHOLD: int = 9500

    def __init__(self):
        self.cumulative_units: int = 0
        self.reset_at: datetime = self._get_next_reset_time()

    def _get_next_reset_time(self) -> datetime:
        """Calculates midnight Pacific Time (PST/PDT approx UTC-7/8) for reset."""
        now = datetime.utcnow()
        # Daily reset at 08:00 UTC (Midnight Pacific Time)
        reset = now.replace(hour=8, minute=0, second=0, microsecond=0)
        if now >= reset:
            reset += timedelta(days=1)
        return reset

    def check_quota_available(self, requested_units: int = 1) -> bool:
        self._check_auto_reset()
        if self.cumulative_units + requested_units > self.PAUSE_THRESHOLD:
            logger.warning(
                f"Quota threshold reached: {self.cumulative_units}/{self.MAX_DAILY_QUOTA} units used."
            )
            return False
        return True

    def track_usage(self, units: int) -> bool:
        self._check_auto_reset()
        if not self.check_quota_available(units):
            return False
        self.cumulative_units += units
        logger.info(f"API Quota used: +{units} units (Total today: {self.cumulative_units}/{self.MAX_DAILY_QUOTA})")
        return True

    def _check_auto_reset(self):
        if datetime.utcnow() >= self.reset_at:
            logger.info("Daily midnight PST reset time reached. Resetting API quota units.")
            self.reset_daily_quota()

    def reset_daily_quota(self):
        self.cumulative_units = 0
        self.reset_at = self._get_next_reset_time()

# Global singleton instance for in-process tracking
global_quota_manager = QuotaManager()
