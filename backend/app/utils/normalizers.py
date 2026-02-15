import re
from typing import Optional

def normalize_string(s: Optional[str]) -> Optional[str]:
    if s is None:
        return None
    return s.strip()

def normalize_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    url = url.strip().lower()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    return url

def normalize_email(email: Optional[str]) -> Optional[str]:
    if not email:
        return None
    return email.strip().lower()

def normalize_company_name(name: Optional[str]) -> Optional[str]:
    if not name:
        return None
    # Remove extra spaces and common suffixes for lookup if needed
    name = re.sub(r'\s+', ' ', name.strip())
    return name
