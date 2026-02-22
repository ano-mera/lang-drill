"use client";

interface Chart {
  type: string;
  title: string;
  description?: string;
  data: any;
}

interface ChartRendererProps {
  chart: Chart;
}

export default function ChartRenderer({ chart }: ChartRendererProps) {
  return <TableChart data={chart.data} />;
}

function TableChart({ data }: { data: any }) {
  if (!data) return null;

  // 新しい形式: { header: [...], rows: [...] }
  if (data.header && data.rows) {
    const { header, rows } = data;

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-black text-base">
          <thead>
            <tr>
              {header.map((headerCell: string, index: number) => (
                <th key={index} className="border border-black px-3 py-1 font-bold text-left" style={{ background: "none", fontWeight: "bold" }}>
                  {String(headerCell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any[], rowIndex: number) => (
              <tr key={rowIndex}>
                {row.map((cell: any, cellIndex: number) => (
                  <td key={cellIndex} className="border border-black px-3 py-1" style={{ background: "none", fontWeight: "normal" }}>
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // レガシー形式: 配列の配列
  if (Array.isArray(data) && Array.isArray(data[0])) {
    const arrayData = data as Array<Array<string | number>>;
    const headers = arrayData[0]; // 最初の行をヘッダーとして使用
    const rows = arrayData.slice(1); // 残りを行データとして使用

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-black text-base">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="border border-black px-3 py-1 font-bold text-left" style={{ background: "none", fontWeight: "bold" }}>
                  {String(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border border-black px-3 py-1" style={{ background: "none", fontWeight: "normal" }}>
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // レガシー形式: オブジェクトの配列
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    const headers = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border border-black text-base">
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} className="border border-black px-3 py-1 font-bold text-left" style={{ background: "none", fontWeight: "bold" }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: Record<string, any>, rowIndex: number) => (
              <tr key={rowIndex}>
                {headers.map((header) => (
                  <td key={header} className="border border-black px-3 py-1" style={{ background: "none", fontWeight: "normal" }}>
                    {String(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div>表データの形式が正しくありません</div>;
}

export type { Chart };
