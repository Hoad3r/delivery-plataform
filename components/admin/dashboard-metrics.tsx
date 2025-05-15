import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, ArrowUp, ArrowDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

// Componente de alerta para métricas
export const MetricAlert = ({ 
  title, 
  description, 
  type = 'info', 
  value, 
  threshold, 
  change 
}) => {
  // Determinar se deve exibir alerta
  const shouldAlert = 
    (type === 'warning' && value < threshold) || 
    (type === 'danger' && value < threshold) ||
    (type === 'success' && value >= threshold);
  
  // Apenas mostrar se deve alertar
  if (!shouldAlert) return null;
  
  return (
    <Alert 
      className={`mb-4 ${
        type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
        type === 'danger' ? 'border-red-500 bg-red-50' :
        'border-green-500 bg-green-50'
      }`}
    >
      <AlertTriangle className={`h-4 w-4 ${
        type === 'warning' ? 'text-yellow-500' :
        type === 'danger' ? 'text-red-500' :
        'text-green-500'
      }`} />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{description}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {value}
          </Badge>
          {change !== undefined && (
            <span className={`text-xs ${
              change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500'
            } flex items-center`}>
              {change > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : change < 0 ? <ArrowDown className="h-3 w-3 mr-1" /> : null}
              {Math.abs(change)}%
            </span>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Componente de configuração de alertas
export const AlertsConfiguration = ({ 
  thresholds = {
    revenue: 1000,
    orders: 10,
    averageValue: 50,
    returnRate: 20,
  },
  onThresholdChange = () => {},
  enabledAlerts = {
    revenue: true,
    orders: true,
    averageValue: false,
    returnRate: false,
  },
  onToggleAlert = () => {}
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Configurar Alertas</h4>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">Receita Mínima</label>
            <Switch 
              checked={enabledAlerts.revenue} 
              onCheckedChange={(checked) => onToggleAlert('revenue', checked)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Slider 
              disabled={!enabledAlerts.revenue}
              value={[thresholds.revenue]} 
              min={100} 
              max={10000} 
              step={100}
              onValueChange={(value) => onThresholdChange('revenue', value[0])}
            />
            <span className="text-sm font-mono w-20">
              R$ {thresholds.revenue}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">Pedidos Mínimos</label>
            <Switch 
              checked={enabledAlerts.orders} 
              onCheckedChange={(checked) => onToggleAlert('orders', checked)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Slider 
              disabled={!enabledAlerts.orders}
              value={[thresholds.orders]} 
              min={1} 
              max={100} 
              step={1}
              onValueChange={(value) => onThresholdChange('orders', value[0])}
            />
            <span className="text-sm font-mono w-20">
              {thresholds.orders} pedidos
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">Valor Médio do Pedido</label>
            <Switch 
              checked={enabledAlerts.averageValue} 
              onCheckedChange={(checked) => onToggleAlert('averageValue', checked)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Slider 
              disabled={!enabledAlerts.averageValue}
              value={[thresholds.averageValue]} 
              min={10} 
              max={200} 
              step={5}
              onValueChange={(value) => onThresholdChange('averageValue', value[0])}
            />
            <span className="text-sm font-mono w-20">
              R$ {thresholds.averageValue}
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">Taxa de Retorno (%)</label>
            <Switch 
              checked={enabledAlerts.returnRate} 
              onCheckedChange={(checked) => onToggleAlert('returnRate', checked)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Slider 
              disabled={!enabledAlerts.returnRate}
              value={[thresholds.returnRate]} 
              min={0} 
              max={100} 
              step={5}
              onValueChange={(value) => onThresholdChange('returnRate', value[0])}
            />
            <span className="text-sm font-mono w-20">
              {thresholds.returnRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal de alertas
export const AlertsManager = ({ metrics }) => {
  const [thresholds, setThresholds] = useState({
    revenue: 1000,
    orders: 10,
    averageValue: 50,
    returnRate: 20,
  });
  
  const [enabledAlerts, setEnabledAlerts] = useState({
    revenue: true,
    orders: true,
    averageValue: false,
    returnRate: false,
  });
  
  const [activeAlerts, setActiveAlerts] = useState([]);
  
  // Atualizar alertas quando as métricas mudarem
  useEffect(() => {
    const newAlerts = [];
    
    if (enabledAlerts.revenue && metrics.totalRevenue < thresholds.revenue) {
      newAlerts.push({
        type: 'warning',
        title: 'Receita Abaixo do Esperado',
        description: 'A receita total está abaixo do valor mínimo configurado.',
        value: `R$ ${metrics.totalRevenue}`,
        threshold: thresholds.revenue,
        change: Number(metrics.revenueGrowth)
      });
    }
    
    if (enabledAlerts.orders && metrics.totalOrders < thresholds.orders) {
      newAlerts.push({
        type: 'warning',
        title: 'Poucos Pedidos',
        description: 'O número de pedidos está abaixo do mínimo configurado.',
        value: metrics.totalOrders,
        threshold: thresholds.orders,
        change: Number(metrics.orderGrowth)
      });
    }
    
    if (enabledAlerts.averageValue && Number(metrics.averageOrderValue) < thresholds.averageValue) {
      newAlerts.push({
        type: 'warning',
        title: 'Valor Médio Baixo',
        description: 'O valor médio dos pedidos está abaixo do esperado.',
        value: `R$ ${metrics.averageOrderValue}`,
        threshold: thresholds.averageValue
      });
    }
    
    const returnRate = metrics.totalCustomers > 0 
      ? (metrics.customerData?.[1]?.value / metrics.totalCustomers) * 100 
      : 0;
      
    if (enabledAlerts.returnRate && returnRate < thresholds.returnRate) {
      newAlerts.push({
        type: 'warning',
        title: 'Taxa de Retorno Baixa',
        description: 'Poucos clientes estão retornando para fazer pedidos.',
        value: `${returnRate.toFixed(1)}%`,
        threshold: thresholds.returnRate
      });
    }
    
    setActiveAlerts(newAlerts);
  }, [metrics, thresholds, enabledAlerts]);
  
  const handleThresholdChange = (key, value) => {
    setThresholds(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleToggleAlert = (key, checked) => {
    setEnabledAlerts(prev => ({
      ...prev,
      [key]: checked
    }));
  };
  
  return (
    <div>
      {activeAlerts.length > 0 && (
        <div className="mb-6">
          {activeAlerts.map((alert, index) => (
            <MetricAlert key={index} {...alert} />
          ))}
        </div>
      )}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            <Bell className="h-4 w-4" />
            Alertas
            {activeAlerts.length > 0 && (
              <Badge className="ml-1 bg-red-500 text-white text-xs">
                {activeAlerts.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <AlertsConfiguration 
            thresholds={thresholds}
            onThresholdChange={handleThresholdChange}
            enabledAlerts={enabledAlerts}
            onToggleAlert={handleToggleAlert}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}; 