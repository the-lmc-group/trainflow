export function parseCSV(csvString: string): Record<string, string>[] {
  const lines = csvString.split("\n").filter((line) => line.trim() !== "");
  const headers = lines[0].split(",").map((header) => header.trim());
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((value) => value.trim());
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });
    records.push(record);
  }
  return records;
}
