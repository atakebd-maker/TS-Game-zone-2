import React from 'react';

interface AdBannerProps {
  format?: '468x60' | '728x90';
  className?: string;
  label?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  format = '728x90',
  className = '',
  label = 'Advertisement',
}) => {
  const isLeaderboard = format === '728x90';
  const width = isLeaderboard ? 728 : 468;
  const height = isLeaderboard ? 90 : 60;
  const key = isLeaderboard ? '99c8bb3d7e850d46a1f6c57bd074dcfc' : 'e319629b800af5757d38b65c63f6bf53';

  const adHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <script type="text/javascript">
    atOptions = {
      'key' : '${key}',
      'format' : 'iframe',
      'height' : ${height},
      'width' : ${width},
      'params' : {}
    };
  </script>
  <script type="text/javascript" src="https://www.highrevenueformat.com/${key}/invoke.js"></script>
</body>
</html>`;

  return (
    <div className={`my-4 flex flex-col items-center justify-center overflow-hidden w-full ${className}`}>
      {label && (
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
          {label}
        </span>
      )}
      <div
        className="relative flex items-center justify-center overflow-x-auto max-w-full rounded-xl bg-slate-100/60 border border-slate-200/80 p-1 shadow-xs"
        style={{ minHeight: height + 8 }}
      >
        <iframe
          title={`Ad ${width}x${height}`}
          srcDoc={adHtml}
          width={width}
          height={height}
          scrolling="no"
          frameBorder="0"
          className="border-0 overflow-hidden block"
          style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }}
        />
      </div>
    </div>
  );
};
