# common/typing.py
import hashlib, json, time, uuid

def correlation_id() -> str:
    return f"c-{int(time.time()*1000)}-{uuid.uuid4().hex[:6]}"

def canonical_hash(obj: dict) -> str:
    s = json.dumps(obj, sort_keys=True, separators=(",", ":"))
    return hashlib.blake2b(s.encode(), digest_size=32).hexdigest()