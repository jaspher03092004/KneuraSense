export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 'N/A';
  
  const dob = new Date(dateOfBirth);
  const today = new Date();
  
  let age = today.getFullYear() - dob.getFullYear();
  const monthDifference = today.getMonth() - dob.getMonth();
  
  // If the current month is before the birth month, or 
  // it's the birth month but the current day is before the birth day, subtract 1
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return (weightKg / (heightM * heightM)).toFixed(1);
}

export function getBMICategory(bmi) {
  if (!bmi) return '';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function downloadCSV(data, filename) {
  if (data.length === 0) return;

  // Define headers based on SensorLog fields in prisma.zip
  const headers = ["Timestamp", "Risk Score", "Angle", "Force", "BPM", "Skin Temp"];
  
  const csvRows = data.map(log => [
    new Date(log.timestamp).toLocaleString(), // From prisma.zip
    log.riskScore,                            // From prisma.zip[cite: 2]
    log.angle,                                // From prisma.zip[cite: 2]
    log.force,                                // From prisma.zip[cite: 2]
    log.bpm || 'N/A',                         // From prisma.zip[cite: 2]
    log.skinTemp                              // From prisma.zip[cite: 2]
  ].join(','));

  const csvContent = [headers.join(','), ...csvRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}