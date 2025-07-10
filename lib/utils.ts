export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}

export function cn(...inputs: any) {
  return inputs.filter(Boolean).join(" ")
}

// Coordenadas fixas do restaurante
export const RESTAURANTE_COORDS = {
  lat: -7.101049,
  lon: -34.833594,
};

// Função para buscar coordenadas de um endereço usando Google Geocoding
export async function buscarCoordenadasPorEndereco(endereco: string): Promise<{ lat: number; lon: number } | null> {
  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  console.log('🔍 Buscando coordenadas para:', endereco);
  console.log('🔑 API Key existe:', !!GOOGLE_API_KEY);
  
  if (!GOOGLE_API_KEY) {
    console.log('❌ API Key não configurada');
    return null;
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(endereco)}&key=${GOOGLE_API_KEY}`;
    console.log('🌐 Fazendo requisição para:', url.replace(GOOGLE_API_KEY, '***'));
    
    const res = await fetch(url);
    const data = await res.json();
    
    console.log('📡 Resposta da API:', {
      status: data.status,
      resultsCount: data.results?.length || 0,
      errorMessage: data.error_message
    });
    
    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      console.log('✅ Coordenadas encontradas:', location);
      return {
        lat: location.lat,
        lon: location.lng,
      };
    } else {
      console.log('❌ Endereço não encontrado ou erro na API:', data.status);
      return null;
    }
  } catch (e) {
    console.log('❌ Erro na requisição:', e);
    return null;
  }
}

// Função para calcular a distância entre dois pontos (Haversine)
export function calcularDistanciaKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Função para calcular a taxa de entrega baseada na distância
export function calcularTaxaEntrega(distanciaKm: number): number | null {
  if (distanciaKm > 20) return null; // Fora da área de entrega
  const taxaBase = 6;
  if (distanciaKm <= 1) return taxaBase;
  // Para cada km adicional, soma 1.5
  return parseFloat((taxaBase + (Math.ceil(distanciaKm - 1) * 1.20)).toFixed(2));
}

// Testes automáticos simples para calcularTaxaEntrega
if (typeof window === 'undefined') { // Só roda no Node, não no browser
  console.log('Teste calcularTaxaEntrega:')
  const distancias = [0.8, 1.2, 2.1, 5.7, 10.1]
  distancias.forEach(d => {
    console.log(`Distância: ${d} km => Taxa:`, calcularTaxaEntrega(d))
  })
}

