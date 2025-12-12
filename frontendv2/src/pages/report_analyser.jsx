import React, { useState } from "react";
// ADDED the import for the consolidated stylesheet
import "../App.css"; 

function ReportAnalyser() {
  const [pdfText, setPdfText] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (event) => {
    setError("");
    setPdfText("");
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      // NOTE: You must ensure 'pdfjs-dist' is installed (npm install pdfjs-dist)
      const pdfjsLib = await import("pdfjs-dist/build/pdf");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let textContent = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        textContent += `\n\n--- Page ${pageNum} ---\n${pageText}`;
      }

      setPdfText(textContent);
    } catch (err) {
      setError("Failed to read PDF file.");
      console.error(err);
    }
  };

  return (
    <div className="report-analyser-container">
      <h1>Report Analyser</h1>
      <p>Upload your medical report PDF and get the extracted text below.</p>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="file-input"
      />
      {error && <p className="error-msg">{error}</p>}
      {fileName && <p className="file-name">File: {fileName}</p>}
      {pdfText && (
        <div className="pdf-text-output" tabIndex="0" aria-label="Extracted report text">
          <pre>{pdfText}</pre>
        </div>
      )}
      <section className="helpful-info">
        <h2>Tips and Info</h2>
        <ul>
          <li>Ensure your report is a clear, scanned PDF for better text extraction.</li>
          <li>Use the analyzed text to check your medical details or share it with your healthcare provider.</li>
          <li>Contact support if the extraction seems incorrect or incomplete.</li>
          <li>This tool respects your privacy; uploaded files are processed locally in your browser.</li>
        </ul>
      </section>
    </div>
  );
}

export default ReportAnalyser;