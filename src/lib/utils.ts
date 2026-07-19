import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatRelativeTime(dateStr: string): string {
  const rtf = new Intl.RelativeTimeFormat('th-TH', { numeric: 'auto' });
  const diffDays = Math.round((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return rtf.format(diffDays, 'day');
}

// TMK Curtains Location
export const TMK_LAT = 13.85442789;
export const TMK_LNG = 100.80685387;

export function extractMapCoordinates(url: string): { lat: number, lng: number } | null {
  if (!url) return null;
  
  // Try to match @lat,lng
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // Try to match pb=!1m18...!2d[lng]!3d[lat]
  const pbMatch2d3d = url.match(/!2d(-?\d+\.\d+).*?!3d(-?\d+\.\d+)/);
  if (pbMatch2d3d) {
    return { lng: parseFloat(pbMatch2d3d[1]), lat: parseFloat(pbMatch2d3d[2]) };
  }
  
  const pbMatch3d2d = url.match(/!3d(-?\d+\.\d+).*?!2d(-?\d+\.\d+)/);
  if (pbMatch3d2d) {
    return { lat: parseFloat(pbMatch3d2d[1]), lng: parseFloat(pbMatch3d2d[2]) };
  }

  // Try to match ?q=lat,lng
  const qMatch = url.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }

  return null;
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

export async function fetchProvinceFromCoords(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=th`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.principalSubdivision) {
      return data.principalSubdivision.replace(/^จังหวัด/, '').trim();
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch province', err);
    return null;
  }
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));
}
