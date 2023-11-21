import time

from utils.format_funding_time import format_funding_time


def get_current_time():
    return format_funding_time(time.time() * 1000)
