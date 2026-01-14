import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

export interface ExportData {
  title: string;
  data: Record<string, unknown>[];
  columns: Array<{
    key: string;
    title: string;
    render?: (value: unknown) => string;
  }>;
}

export const exportToPDF = async (elementId: string, filename: string = 'report.pdf') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

export const exportToExcel = (data: ExportData[], filename: string = 'report.xlsx') => {
  try {
    const workbook = XLSX.utils.book_new();

    data.forEach((sheet) => {
      // Prepare data for Excel
      const excelData = sheet.data.map(row => {
        const excelRow: Record<string, unknown> = {};
        sheet.columns.forEach((col) => {
          const value = row[col.key];
          excelRow[col.title] = col.render ? col.render(value) : value;
        });
        return excelRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.title);
    });

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const formatGrowthRate = (rate: number): { value: string; color: string; trend: string } => {
  const formattedRate = `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`;
  
  if (rate > 0) {
    return {
      value: formattedRate,
      color: '#52c41a',
      trend: 'up'
    };
  } else if (rate < 0) {
    return {
      value: formattedRate,
      color: '#ff4d4f',
      trend: 'down'
    };
  } else {
    return {
      value: '0.0%',
      color: '#666',
      trend: 'flat'
    };
  }
};

export const generatePeriodComparison = (currentData: Record<string, unknown>[], previousData: Record<string, unknown>[], keyField: string, valueField: string) => {
  const comparison = currentData.map(current => {
    const previous = previousData.find(p => p[keyField] === current[keyField]);
    const currentValue = (current[valueField] as number) || 0;
    const previousValue = (previous?.[valueField] as number) || 0;
    const growth = calculateGrowthRate(currentValue, previousValue);
    
    return {
      ...current,
      [valueField + '_previous']: previousValue,
      [valueField + '_growth']: growth,
      [valueField + '_growthFormatted']: formatGrowthRate(growth)
    };
  });

  return comparison;
};

export const predictTrend = (data: number[], periods: number = 3): number[] => {
  if (data.length < 2) return [];
  
  // Simple linear regression for trend prediction
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;
  
  // Calculate slope and intercept
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Predict future values
  const predictions = [];
  for (let i = n; i < n + periods; i++) {
    predictions.push(Math.max(0, slope * i + intercept));
  }
  
  return predictions;
};

export const generateReportFilename = (type: 'pdf' | 'excel', reportType: string, dateRange?: { start: string; end: string }): string => {
  const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
  const dateStr = dateRange ? `_${dateRange.start}_to_${dateRange.end}` : '';
  const extension = type === 'pdf' ? 'pdf' : 'xlsx';
  
  return `${reportType}_${timestamp}${dateStr}.${extension}`;
};
