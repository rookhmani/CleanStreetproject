import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

const API_ORIGIN = (
  process.env.REACT_APP_FILE_BASE_URL ||
  (process.env.REACT_APP_API_URL || '').replace(/\/api\/?$/, '') ||
  'http://localhost:5000'
).replace(/\/$/, '');

const resolveFileUrl = (url) => {
  if (!url || url.startsWith('http')) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};

// Format date for reports
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Generate CSV Report for All Complaints
export const generateCSVReport = (complaints) => {
  const data = complaints.map(complaint => ({
    'Complaint ID': complaint._id || 'N/A',
    'Title': complaint.title || 'N/A',
    'Description': complaint.description || 'N/A',
    'Status': complaint.status || 'N/A',
    'Priority': complaint.priority || 'N/A',
    'Reported By': complaint.user_id?.name || 'N/A',
    'Reporter Email': complaint.user_id?.email || 'N/A',
    'Assigned To': complaint.assigned_to?.name || 'Unassigned',
    'Address': complaint.address || 'N/A',
    'Created Date': formatDate(complaint.created_at),
    'Updated Date': formatDate(complaint.updated_at),
    'Upvotes': complaint.upvotes || 0,
    'Downvotes': complaint.downvotes || 0
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `complaints_report_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Generate Excel Report for All Complaints
export const generateExcelReport = (complaints) => {
  const data = complaints.map(complaint => ({
    'Complaint ID': complaint._id || 'N/A',
    'Title': complaint.title || 'N/A',
    'Description': complaint.description || 'N/A',
    'Status': complaint.status || 'N/A',
    'Priority': complaint.priority || 'N/A',
    'Reported By': complaint.user_id?.name || 'N/A',
    'Reporter Email': complaint.user_id?.email || 'N/A',
    'Assigned To': complaint.assigned_to?.name || 'Unassigned',
    'Address': complaint.address || 'N/A',
    'Created Date': formatDate(complaint.created_at),
    'Updated Date': formatDate(complaint.updated_at),
    'Upvotes': complaint.upvotes || 0,
    'Downvotes': complaint.downvotes || 0
  }));

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const headers = Object.keys(data[0] || {});
  const rows = data.map((row) =>
    `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join('')}</tr>`
  ).join('');
  const headerRow = `<tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>`;
  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"></head>
      <body><table>${headerRow}${rows}</table></body>
    </html>
  `;
  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `complaints_report_${Date.now()}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// Generate PDF Report for All Complaints
export const generatePDFReport = (complaints) => {
  try {
    console.log('Starting PDF generation with', complaints.length, 'complaints');
    
    if (!complaints || complaints.length === 0) {
      throw new Error('No complaints data to generate PDF');
    }
    
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Complaints Report', 14, 20);
    
    // Add generation date
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Complaints: ${complaints.length}`, 14, 34);

    // Prepare table data
    const tableData = complaints.map(complaint => [
      complaint.title || 'N/A',
      (complaint.description || 'N/A').substring(0, 50) + '...',
      complaint.status || 'N/A',
      complaint.priority || 'N/A',
      complaint.user_id?.name || 'N/A',
      complaint.assigned_to?.name || 'Unassigned',
      formatDate(complaint.created_at)
    ]);

    console.log('Table data prepared, generating PDF table...');

    // Generate table
    doc.autoTable({
      startY: 40,
      head: [['Title', 'Description', 'Status', 'Priority', 'Reported By', 'Assigned To', 'Date']],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 60 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 35 },
        5: { cellWidth: 35 },
        6: { cellWidth: 30 }
      }
    });

    const filename = `complaints_report_${Date.now()}.pdf`;
    console.log('Saving PDF as:', filename);
    doc.save(filename);
    console.log('PDF saved successfully');
    
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};

// Generate Detailed PDF for Single Complaint
export const generateDetailedComplaintPDF = async (complaint, comments = []) => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('Complaint Details Report', 14, yPosition);
  yPosition += 10;

  // Metadata
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, yPosition);
  yPosition += 8;
  doc.text(`Complaint ID: ${complaint._id}`, 14, yPosition);
  yPosition += 10;

  // Complaint Information Section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  doc.text('Complaint Information', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');

  // Title
  doc.setFont(undefined, 'bold');
  doc.text('Title:', 14, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(complaint.title || 'N/A', 35, yPosition);
  yPosition += 7;

  // Status with color
  doc.setFont(undefined, 'bold');
  doc.text('Status:', 14, yPosition);
  doc.setFont(undefined, 'normal');
  const statusColors = {
    'received': [52, 152, 219],
    'in_review': [241, 196, 15],
    'assigned': [155, 89, 182],
    'resolved': [46, 204, 113],
    'rejected': [231, 76, 60]
  };
  const statusColor = statusColors[complaint.status] || [0, 0, 0];
  doc.setTextColor(...statusColor);
  doc.text((complaint.status || 'N/A').toUpperCase(), 35, yPosition);
  doc.setTextColor(0);
  yPosition += 7;

  // Priority
  doc.setFont(undefined, 'bold');
  doc.text('Priority:', 14, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text((complaint.priority || 'N/A').toUpperCase(), 35, yPosition);
  yPosition += 7;

  // Reporter
  doc.setFont(undefined, 'bold');
  doc.text('Reported By:', 14, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(complaint.user_id?.name || 'N/A', 40, yPosition);
  yPosition += 5;
  doc.text(`Email: ${complaint.user_id?.email || 'N/A'}`, 40, yPosition);
  yPosition += 7;

  // Assigned To
  doc.setFont(undefined, 'bold');
  doc.text('Assigned To:', 14, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(complaint.assigned_to?.name || 'Unassigned', 40, yPosition);
  if (complaint.assigned_to?.email) {
    yPosition += 5;
    doc.text(`Email: ${complaint.assigned_to.email}`, 40, yPosition);
  }
  yPosition += 7;

  // Dates
  doc.setFont(undefined, 'bold');
  doc.text('Created Date:', 14, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatDate(complaint.created_at), 45, yPosition);
  yPosition += 5;
  doc.setFont(undefined, 'bold');
  doc.text('Last Updated:', 14, yPosition);
  doc.setFont(undefined, 'normal');
  doc.text(formatDate(complaint.updated_at), 45, yPosition);
  yPosition += 10;

  // Address
  doc.setFont(undefined, 'bold');
  doc.text('Location:', 14, yPosition);
  yPosition += 5;
  doc.setFont(undefined, 'normal');
  const addressLines = doc.splitTextToSize(complaint.address || 'N/A', 170);
  doc.text(addressLines, 14, yPosition);
  yPosition += (addressLines.length * 5) + 5;

  // Description Section
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Description', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  const descLines = doc.splitTextToSize(complaint.description || 'No description provided', 180);
  doc.text(descLines, 14, yPosition);
  yPosition += (descLines.length * 5) + 10;

  // Images Section
  if (complaint.photo && complaint.photo.length > 0) {
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Attached Images', 14, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    
    for (let i = 0; i < complaint.photo.length; i++) {
      let imageUrl = complaint.photo[i];
      
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      try {
        // Handle different URL formats
        imageUrl = resolveFileUrl(imageUrl);

        // Load image using proxy to avoid CORS
        const img = await loadImageWithProxy(imageUrl);
        const imgWidth = 80;
        const imgHeight = 60;
        
        if (yPosition + imgHeight > 280) {
          doc.addPage();
          yPosition = 20;
        }

        doc.addImage(img, 'JPEG', 14, yPosition, imgWidth, imgHeight);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Image ${i + 1}`, 14, yPosition + imgHeight + 5);
        doc.setTextColor(0);
        yPosition += imgHeight + 10;
      } catch (error) {
        // If image loading fails, show a placeholder message
        console.error('Failed to load image:', imageUrl, error);
        doc.setTextColor(150);
        doc.setFontSize(9);
        doc.text(`Image ${i + 1}: Unable to load image`, 14, yPosition);
        doc.setFontSize(8);
        doc.text(`URL: ${imageUrl.substring(0, 60)}...`, 14, yPosition + 4);
        doc.setTextColor(0);
        yPosition += 12;
      }
    }
    yPosition += 5;
  }

  // Comments Section
  if (comments && comments.length > 0) {
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Comments (${comments.length})`, 14, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    comments.forEach((comment, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      // Comment header
      doc.setFont(undefined, 'bold');
      doc.text(`${comment.user_id?.name || 'Anonymous'}`, 14, yPosition);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100);
      doc.text(formatDate(comment.created_at), 80, yPosition);
      doc.setTextColor(0);
      yPosition += 5;

      // Comment text
      const commentLines = doc.splitTextToSize(comment.comment_text || '', 180);
      doc.text(commentLines, 14, yPosition);
      yPosition += (commentLines.length * 4) + 8;
    });
  }

  // Voting Stats
  if (yPosition > 260) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Community Engagement', 14, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Upvotes: ${complaint.upvotes || 0}`, 14, yPosition);
  doc.text(`Downvotes: ${complaint.downvotes || 0}`, 70, yPosition);

  // Save PDF
  doc.save(`complaint_${complaint._id}_${Date.now()}.pdf`);
};

// Helper function to load images with proxy for CORS
const loadImageWithProxy = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Create canvas to convert image to data URL
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      } catch (error) {
        reject(new Error('Failed to convert image to data URL: ' + error.message));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image from URL'));
    };
    
    // Set crossOrigin before setting src
    img.crossOrigin = 'anonymous';
    
    // Handle different URL formats
    let imageUrl = resolveFileUrl(url);
    
    img.src = imageUrl;
  });
};

