import type { Metadata } from 'next';
import './globals.css';
import './portfolio-match.css';
export const metadata: Metadata = { title:'GEXP Atlas — Find your exchange fit', description:'Plan your SUTD exchange with the 2027 university and historical course reference data. Get four evidence-backed options and fill the GEXP study-plan templates.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
