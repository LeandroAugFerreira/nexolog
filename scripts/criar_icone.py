"""Ícone do cubo logístico em ICO, usando somente a biblioteca padrão."""
from pathlib import Path
import struct
import zlib

SIZE = 64
FACES = [([(32,4),(56,18),(32,32),(8,18)], (0,201,247,255)),
         ([(8,18),(32,32),(32,60),(8,46)], (0,164,219,255)),
         ([(56,18),(32,32),(32,60),(56,46)], (0,101,162,255)),
         ([(22,23),(32,29),(42,23),(42,34),(32,40),(22,34)], (4,23,41,255))]

def inside(x, y, points):
    result = False
    for index, (px, py) in enumerate(points):
        qx, qy = points[index - 1]
        if (py > y) != (qy > y) and x < (qx - px) * (y - py) / (qy - py) + px:
            result = not result
    return result

def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))

rows = bytearray()
for y in range(SIZE):
    rows.append(0)
    for x in range(SIZE):
        color = (0,0,0,0)
        for points, face in FACES:
            if inside(x + .5, y + .5, points):
                color = face
        rows.extend(color)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', SIZE,SIZE,8,6,0,0,0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')
ico = struct.pack('<HHH', 0,1,1) + struct.pack('<BBBBHHII', SIZE,SIZE,0,0,1,32,len(png),22) + png
(Path(__file__).resolve().parents[1] / 'desktop' / 'nexolog.ico').write_bytes(ico)
