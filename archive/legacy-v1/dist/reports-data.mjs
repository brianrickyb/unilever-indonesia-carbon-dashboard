// Manually transcribed from the official PDFs; printed page and PDF page are distinct.
// Primary-table Scope 2 dashes are deliberately null, even where secondary tables show zero.
export const reportIndex='https://www.unilever.co.id/en/investors/annual-financial-and-sustainability-report/sustainability-reports/';
export const reports=Object.freeze([
 {year:2021,scope1:20858.40,scope2:null,scope3:2843661,operational:20858.40,fullValueChain:2864519.40,fuel:20626.82,refrigerants:231.58,intensity:12.95,page:94,pdfPage:96,intensityPage:94,intensityPdf:96,url:'https://www.unilever.co.id/files/sustainability-report-2021-id.pdf',scope3Note:'Scope 3 dilaporkan dalam lima kelompok rantai nilai pada hlm. 94.',scope2Note:'Tabel utama menampilkan tanda “–”. Tabel pembanding laporan 2022 hlm. 98 menampilkan angka 0 untuk 2021.',boundary:'Pabrik, logistik dan kantor. Intensitas hanya manufaktur.',caveat:'Data historis sesuai laporan tahun 2021; Scope 3 tidak diekstrapolasi ke tahun berikutnya.'},
 {year:2022,scope1:16516.70,scope2:null,scope3:null,operational:16516.70,fullValueChain:null,fuel:15994.39,refrigerants:522.31,intensity:15.56,page:98,pdfPage:100,intensityPage:98,intensityPdf:100,url:'https://www.unilever.co.id/files/indonesia-sustainability-report-2022.pdf',scope3Note:'Angka Scope 3 tidak tercantum pada tabel emisi hlm. 98 yang diekstrak.',scope2Note:'Tabel utama menampilkan “–”; tabel pengurangan emisi di halaman yang sama menampilkan 0.',boundary:'Pabrik, logistik dan kantor. Intensitas hanya manufaktur.',caveat:'Intensitas naik dibanding 2021 walaupun emisi absolut turun. Keduanya memakai batas pelaporan berbeda.'},
 {year:2023,scope1:14662.90,scope2:null,scope3:null,operational:14662.90,fullValueChain:null,fuel:14525.70,refrigerants:137.20,intensity:14.50,page:168,pdfPage:170,intensityPage:169,intensityPdf:171,url:'https://www.unilever.co.id/files/7a7fa3d4-b017-4943-95c4-ead368c8ed54/unilever-sustainability-report-2023-hires.pdf',scope3Note:'Hlm. 168 menyatakan pendataan Scope 3 masih berlangsung.',scope2Note:'Tabel utama menampilkan “–”. Tabel pembanding laporan 2025 hlm. 186 menampilkan angka 0 untuk 2023.',boundary:'Manufaktur, logistik gudang dan Grha Unilever; pendekatan operational control. Intensitas hanya manufaktur.',caveat:'Tidak tersedia seri Scope 3 yang berkesinambungan setelah 2021.'},
 {year:2024,scope1:10960.41,scope2:null,scope3:null,operational:10960.41,fullValueChain:null,fuel:10710.42,refrigerants:249.99,intensity:11.40,page:186,pdfPage:188,detailPage:187,detailPdf:189,intensityPage:187,intensityPdf:189,url:'https://www.unilever.co.id/files/indonesia-sustainability-report-2024.pdf',scope3Note:'Hlm. 186 menyatakan Scope 3 belum dapat dipublikasikan karena pendataan dan penghitungan berlangsung.',scope2Note:'Tabel utama hlm. 187 menampilkan “–”. Narasi hlm. 188 membahas I-REC; bukan angka location-based yang dapat diisi nol.',boundary:'Manufaktur, logistik gudang dan Grha Unilever; pendekatan operational control. Intensitas hanya manufaktur.',caveat:'Grafik intensitas menunjukkan 11,40 untuk 2024; catatan di bawahnya masih merujuk 14,5 pada 2023. Dashboard memakai nilai grafik 2024.'},
 {year:2025,scope1:7869.19,scope2:null,scope3:null,operational:7869.19,fullValueChain:null,fuel:7590.51,refrigerants:278.68,intensity:7.70,page:184,pdfPage:186,intensityPage:185,intensityPdf:187,url:'https://www.unilever.co.id/files/sustainability-report-2025.pdf',scope3Note:'Hlm. 184 menyatakan Scope 3 belum dipublikasikan; pengumpulan data dan metode masih dikembangkan.',scope2Note:'Tabel utama hlm. 184 menampilkan “–”; tabel pengurangan emisi hlm. 186 menampilkan 0. Narasi mengaitkannya dengan I-REC, bukan emisi fisik jaringan yang nol.',boundary:'Manufaktur, logistik gudang dan Grha Unilever. Cakupan gudang bertambah dari 3 menjadi 11; pabrik es krim dilaporkan Januari–November 2025.',caveat:'Perubahan batas: gudang 3 → 11 (hlm. 185); periode es krim Januari–November akibat divestasi/de-merger (hlm. 182). Perubahan tahunan belum dinormalisasi.'}
].map(Object.freeze));
export const scope3Breakdown=Object.freeze([
 {label:'Bahan baku & kemasan',value:1166878},
 {label:'Penggunaan oleh konsumen',value:869312},
 {label:'Distribusi & retail',value:591441},
 {label:'Pembuangan',value:189049},
 {label:'Transportasi masuk',value:26981}
]);
export const metricLabels={operational:'Operasional · Scope 1 + 2',scope1:'Scope 1',scope2:'Scope 2 · tabel utama',scope3:'Scope 3',fuel:'Gas & light fuel',refrigerants:'Refrigeran',intensity:'Intensitas manufaktur',fullValueChain:'Total rantai nilai'};
export function yearChange(year,key){const i=reports.findIndex(r=>r.year===Number(year));if(i<1)return null;const a=reports[i][key],b=reports[i-1][key];return a===null||b===null||b===0?null:(a-b)/b*100;}
export function reportScenario(year,fuelPercent,leakPercent){
 if([fuelPercent,leakPercent].some(v=>!Number.isFinite(v)||v<0||v>100))throw new Error('Persentase harus antara 0 dan 100.');
 const r=reports.find(r=>r.year===Number(year));if(!r)throw new Error('Tahun tidak tersedia.');
 const fuelSaving=r.fuel*fuelPercent/100,leakSaving=r.refrigerants*leakPercent/100;
 return {baseline:r.operational,avoided:Math.min(r.operational,fuelSaving+leakSaving),projected:Math.max(0,r.operational-fuelSaving-leakSaving),fuelSaving,leakSaving};
}
const csvCell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
export function reportCsv(){
 const out=[['company','year','metric','value','unit','status','boundary','printed_page','pdf_page','source_url','notes']];
 for(const r of reports)for(const k of Object.keys(metricLabels)){
  const intensity=k==='intensity',component=['fuel','refrigerants','scope2'].includes(k),page=intensity?r.intensityPage:component?(r.detailPage??r.page):k==='operational'&&r.year===2025?186:r.page,pdf=intensity?r.intensityPdf:component?(r.detailPdf??r.pdfPage):k==='operational'&&r.year===2025?188:r.pdfPage;
  out.push(['PT Unilever Indonesia Tbk',r.year,k,r[k],intensity?'kg CO2e/tonne product':'t CO2e',k==='scope2'?'reported_dash':r[k]===null?'not_disclosed':'reported',intensity?'manufacturing_only':'reported_organisational_boundary',page,pdf,r.url,k==='scope2'?r.scope2Note:k==='scope3'?r.scope3Note:r.caveat]);
 }
 return out.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
