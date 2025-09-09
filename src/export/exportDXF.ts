import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type ExportInput = {
  mode: string;
  driver: { name: string };
  box: { Vb: number; wallThickness?: number };
  result: { Vb: number; Fb?: number };
};

const dxfHeader = () => `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
0
ENDSEC
0
SECTION
2
ENTITIES
`;

const dxfFooter = () => `0
ENDSEC
0
EOF
`;

function dxfRect(x: number, y: number, w: number, h: number, layer = 'PANELS') {
  const pts = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
    [x, y]
  ];
  let s = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    s += `0
LINE
8
${layer}
10
${x1}
20
${y1}
11
${x2}
21
${y2}
`;
  }
  return s;
}

export function exportDXF(input: ExportInput): string {
  const { box, result } = input;
  const t = box.wallThickness ?? 0.75;
  const width = 28;
  const height = 16;
  const depth = 14;

  let body = '';
  const gap = 2;
  const panels = [
    { w: width, h: height, name: 'Front' },
    { w: width, h: height, name: 'Back' },
    { w: width, h: depth, name: 'Top' },
    { w: width, h: depth, name: 'Bottom' },
    { w: depth, h: height, name: 'Left' },
    { w: depth, h: height, name: 'Right' }
  ];
  let cursorX = 0;
  panels.forEach((p) => {
    body += dxfRect(cursorX, 0, p.w, p.h);
    cursorX += p.w + gap;
  });

  body += `0
TEXT
8
NOTES
10
0
20
${height + 10}
40
0.25
1
Vb=${result.Vb.toFixed(1)}L Fb=${result.Fb ?? '-'} t=${t}in
`;

  return dxfHeader() + body + dxfFooter();
}

export async function saveDXF(dxf: string, filename: string): Promise<string> {
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
  const fileUri = dir + filename;
  await FileSystem.writeAsStringAsync(fileUri, dxf, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/dxf', dialogTitle: 'Share DXF' });
  }
  return fileUri;
}
