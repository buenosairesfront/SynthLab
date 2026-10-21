# Minimal zipalign: rewrites an APK so every STORED entry's data starts on a 4-byte boundary.
import sys, zipfile
src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(src) as zin, zipfile.ZipFile(dst, 'w') as zout:
    for info in zin.infolist():
        data = zin.read(info.filename)
        ni = zipfile.ZipInfo(info.filename, date_time=(1980, 1, 1, 0, 0, 0))
        ni.compress_type = info.compress_type
        ni.external_attr = info.external_attr
        if ni.compress_type == zipfile.ZIP_STORED:
            off = zout.fp.tell() + 30 + len(info.filename.encode())
            pad = (4 - off % 4) % 4
            ni.extra = b'\0' * pad
        zout.writestr(ni, data)
