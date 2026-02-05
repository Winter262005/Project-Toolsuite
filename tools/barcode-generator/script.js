function generateBarcode() {
    const text = document.getElementById("barcodeInput").value.trim();
    const type = document.getElementById("barcodeType").value;
  
    if (!text) {
      alert("Enter some text or numbers first.");
      return;
    }
  
    try {
      JsBarcode("#barcode", text, {
        format: type,
        lineColor: "#000",
        width: 2,
        height: 100,
        displayValue: true,
      });
    } catch (error) {
      alert("Invalid input for selected barcode type.");
    }
  }
  
  function downloadBarcode() {
    const svg = document.getElementById("barcode");
    if (!svg.innerHTML) {
      alert("Generate a barcode first.");
      return;
    }
  
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
  
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
  
      const pngFile = canvas.toDataURL("image/png");
  
      const downloadLink = document.createElement("a");
      downloadLink.download = "barcode.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
  
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  }
  