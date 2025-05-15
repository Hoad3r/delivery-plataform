import { lazy } from 'react';
import { 
  BarChart, LineChart, PieChart, ResponsiveContainer, 
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, Pie, Cell 
} from 'recharts';

// Componentes com lazy loading para otimização de performance
export const LazyChart = ({ type, data, children, height = 300 }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' && (
          <BarChart data={data}>
            {children}
          </BarChart>
        )}
        {type === 'line' && (
          <LineChart data={data}>
            {children}
          </LineChart>
        )}
        {type === 'pie' && (
          <PieChart>
            {children}
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

// Elementos de gráfico pré-definidos para facilitar o uso
export const ChartElements = {
  Grid: () => <CartesianGrid strokeDasharray="3 3" />,
  XAxis: (props) => <XAxis {...props} />,
  YAxis: (props) => <YAxis {...props} />,
  Tooltip: (props) => <Tooltip {...props} />,
  Legend: (props) => <Legend {...props} />,
  Bar: (props) => <Bar {...props} />,
  Line: (props) => <Line {...props} />,
  Pie: (props) => <Pie {...props} />
};

// Componente para previsões baseadas em tendências
export const TrendPrediction = ({ historicalData, predictionMonths = 3 }) => {
  // Implementação simples de previsão linear
  const predictFutureValues = (data) => {
    if (!data || data.length < 2) return [];

    // Usar os últimos 6 meses (ou disponível) para calcular tendência
    const samples = data.slice(-6);
    const n = samples.length;
    
    // Calcular coeficientes para regressão linear
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    samples.forEach((item, index) => {
      sumX += index;
      sumY += item.value || item.orders || item.revenue || 0;
      sumXY += index * (item.value || item.orders || item.revenue || 0);
      sumX2 += index * index;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Gerar previsões
    const predictions = [];
    const lastValue = samples[n-1].value || samples[n-1].orders || samples[n-1].revenue || 0;
    const lastMonth = samples[n-1].month || 'Dec';
    
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const lastMonthIndex = months.indexOf(lastMonth);
    
    for (let i = 1; i <= predictionMonths; i++) {
      const predictedValue = intercept + slope * (n + i - 1);
      const monthIndex = (lastMonthIndex + i) % 12;
      
      predictions.push({
        month: months[monthIndex],
        predicted: Math.max(0, Math.round(predictedValue)), // Evitar valores negativos
        isPrediction: true
      });
    }
    
    return predictions;
  };
  
  const predictions = predictFutureValues(historicalData);
  const combinedData = [...historicalData, ...predictions];
  
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="orders" 
            stroke="#8884d8" 
            strokeWidth={2}
            activeDot={{ r: 8 }} 
            dot={{ r: 4 }}
            name="Pedidos Reais"
          />
          <Line 
            type="monotone" 
            dataKey="predicted" 
            stroke="#82ca9d" 
            strokeWidth={2}
            strokeDasharray="5 5"
            activeDot={{ r: 6 }} 
            dot={{ r: 3 }}
            name="Previsão"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 