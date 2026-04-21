export const downloadCertificate = ({ learnerName, courseTitle }) => {
  const content = `
  <html>
    <head>
      <title>Certificate</title>
      <style>
        body { font-family: Georgia, serif; padding: 48px; background: #f8fafc; }
        .card { background: white; border: 12px solid #0f766e; border-radius: 24px; padding: 48px; text-align: center; }
        h1 { font-size: 44px; margin-bottom: 16px; color: #0f172a; }
        h2 { font-size: 28px; margin: 16px 0; color: #134e4a; }
        p { font-size: 20px; color: #334155; }
      </style>
    </head>
    <body>
      <div class="card">
        <p>Certificate of Completion</p>
        <h1>${learnerName}</h1>
        <p>has successfully completed</p>
        <h2>${courseTitle}</h2>
      </div>
    </body>
  </html>`;

  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${courseTitle.replace(/\s+/g, "-").toLowerCase()}-certificate.html`;
  link.click();
  URL.revokeObjectURL(url);
};
