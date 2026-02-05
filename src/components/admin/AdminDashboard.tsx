import { useMemo, useState } from 'react';
import { 
  Users, Package, FileText, Clock, CheckCircle, XCircle, 
  TrendingUp, BarChart3, Shield, Calendar as CalendarIcon, 
  Download, Filter, ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  format, subDays, startOfDay, eachDayOfInterval, 
  subMonths, startOfMonth, endOfMonth, eachMonthOfInterval,
  subYears, parseISO
} from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface QuoteRequest {
  id: string;
  status: string;
  created_at: string;
  subject?: string;
  message?: string;
  user_id?: string;
}

interface Profile {
  id: string;
  joined_at: string;
  role?: string;
  full_name?: string;
  email?: string;
}

interface Product {
  id: string;
  is_active: boolean;
  is_trending: boolean;
  category: string | null;
}

interface AdminDashboardProps {
  quoteRequests: QuoteRequest[];
  profiles: Profile[];
  products: Product[];
  isSuperAdmin?: boolean;
}

type TimeRange = '7days' | '30days' | '90days' | '6months' | '1year' | 'custom';

const CHART_COLORS = {
  primary: '#3b82f6', // blue-500
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  muted: '#6b7280', // gray-500
  accent: '#06b6d4', // cyan-500
  info: '#6366f1', // indigo-500
  purple: '#8b5cf6', // violet-500
};

export function AdminDashboard({ quoteRequests, profiles, products, isSuperAdmin = false }: AdminDashboardProps) {
  const [quoteTimeRange, setQuoteTimeRange] = useState<TimeRange>('7days');
  const [userTimeRange, setUserTimeRange] = useState<TimeRange>('7days');
  const [quoteDateRange, setQuoteDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [userDateRange, setUserDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  const stats = useMemo(() => ({
    totalUsers: profiles.length,
    totalProducts: products.length,
    activeProducts: products.filter(p => p.is_active).length,
    trendingProducts: products.filter(p => p.is_trending).length,
    totalQuotes: quoteRequests.length,
    pending: quoteRequests.filter(r => r.status === 'pending').length,
    approved: quoteRequests.filter(r => r.status === 'approved').length,
    rejected: quoteRequests.filter(r => r.status === 'rejected').length,
    totalAdmins: profiles.filter(p => p.role === 'admin').length,
    totalSuperAdmins: profiles.filter(p => p.role === 'super_admin').length,
  }), [quoteRequests, profiles, products]);

  // Enhanced Quote status pie chart with donut design
  const quoteStatusData = useMemo(() => {
    const data = [
      { name: 'Pending', value: stats.pending, color: CHART_COLORS.warning },
      { name: 'Approved', value: stats.approved, color: CHART_COLORS.success },
      { name: 'Rejected', value: stats.rejected, color: CHART_COLORS.danger },
    ];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
    }));
  }, [stats]);

  // Get date range based on selection
  const getDateRange = (range: TimeRange, customRange?: { from: Date; to: Date }) => {
    const now = new Date();
    switch (range) {
      case '7days':
        return { start: subDays(now, 6), end: now };
      case '30days':
        return { start: subDays(now, 29), end: now };
      case '90days':
        return { start: subDays(now, 89), end: now };
      case '6months':
        return { start: subMonths(now, 5), end: now };
      case '1year':
        return { start: subYears(now, 1), end: now };
      case 'custom':
        return { start: customRange?.from || subDays(now, 6), end: customRange?.to || now };
      default:
        return { start: subDays(now, 6), end: now };
    }
  };

  // Enhanced Quotes trend with different time ranges
  const quoteTrendData = useMemo(() => {
    const { start, end } = getDateRange(quoteTimeRange, quoteDateRange);
    let interval: Date[];
    
    if (quoteTimeRange === '6months' || quoteTimeRange === '1year') {
      interval = eachMonthOfInterval({ start, end });
      return interval.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthQuotes = quoteRequests.filter(q => {
          const createdAt = new Date(q.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        });

        return {
          date: format(month, 'MMM yyyy'),
          fullDate: format(month, 'MMMM yyyy'),
          total: monthQuotes.length,
          pending: monthQuotes.filter(q => q.status === 'pending').length,
          approved: monthQuotes.filter(q => q.status === 'approved').length,
          rejected: monthQuotes.filter(q => q.status === 'rejected').length,
        };
      });
    } else {
      interval = eachDayOfInterval({ start, end });
      return interval.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayQuotes = quoteRequests.filter(q => {
          const createdAt = new Date(q.created_at);
          return createdAt >= dayStart && createdAt < dayEnd;
        });

        return {
          date: format(day, quoteTimeRange === '90days' ? 'MMM d' : 'EEE'),
          fullDate: format(day, 'MMM d, yyyy'),
          total: dayQuotes.length,
          pending: dayQuotes.filter(q => q.status === 'pending').length,
          approved: dayQuotes.filter(q => q.status === 'approved').length,
          rejected: dayQuotes.filter(q => q.status === 'rejected').length,
        };
      });
    }
  }, [quoteRequests, quoteTimeRange, quoteDateRange]);

  // Enhanced User registrations with different time ranges
  const userTrendData = useMemo(() => {
    const { start, end } = getDateRange(userTimeRange, userDateRange);
    let interval: Date[];
    
    if (userTimeRange === '6months' || userTimeRange === '1year') {
      interval = eachMonthOfInterval({ start, end });
      return interval.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        
        const monthUsers = profiles.filter(p => {
          const joinedAt = new Date(p.joined_at);
          return joinedAt >= monthStart && joinedAt <= monthEnd;
        });

        return {
          date: format(month, 'MMM yyyy'),
          fullDate: format(month, 'MMMM yyyy'),
          users: monthUsers.length,
        };
      });
    } else {
      interval = eachDayOfInterval({ start, end });
      return interval.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayUsers = profiles.filter(p => {
          const joinedAt = new Date(p.joined_at);
          return joinedAt >= dayStart && joinedAt < dayEnd;
        });

        return {
          date: format(day, userTimeRange === '90days' ? 'MMM d' : 'EEE'),
          fullDate: format(day, 'MMM d, yyyy'),
          users: dayUsers.length,
        };
      });
    }
  }, [profiles, userTimeRange, userDateRange]);

  // Enhanced Product categories distribution with progress bars
  const productCategoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    const totalProducts = products.length;
    return Object.entries(categories)
      .map(([name, value], index) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        value,
        percentage: totalProducts > 0 ? ((value / totalProducts) * 100).toFixed(1) : '0',
        color: [CHART_COLORS.primary, CHART_COLORS.accent, CHART_COLORS.success, 
                CHART_COLORS.warning, CHART_COLORS.purple, CHART_COLORS.info][index % 6],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [products]);

  // Daily quotes data with expanded view
  const dailyQuotes = useMemo(() => {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    
    const todayQuotes = quoteRequests.filter(q => {
      const createdAt = new Date(q.created_at);
      return startOfDay(createdAt).getTime() === today.getTime();
    });

    const yesterdayQuotes = quoteRequests.filter(q => {
      const createdAt = new Date(q.created_at);
      return startOfDay(createdAt).getTime() === yesterday.getTime();
    });

    return {
      today: todayQuotes.length,
      yesterday: yesterdayQuotes.length,
      todayDetails: todayQuotes.map(q => ({
        id: q.id,
        subject: q.subject,
        status: q.status,
        time: format(parseISO(q.created_at), 'hh:mm a'),
      })),
    };
  }, [quoteRequests]);

  const colorClasses: Record<string, string> = {
    primary: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-600 bg-blue-500/20',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-600 bg-purple-500/20',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-600 bg-blue-500/20',
    warning: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-600 bg-amber-500/20',
    success: 'from-green-500/10 to-green-500/5 border-green-500/20 text-green-600 bg-green-500/20',
    danger: 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-600 bg-red-500/20',
    indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-600 bg-indigo-500/20',
    yellow: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 text-yellow-600 bg-yellow-500/20',
  };

  const TimeRangeSelector = ({ 
    value, 
    onChange, 
    dateRange, 
    onDateRangeChange,
    label 
  }: {
    value: TimeRange;
    onChange: (value: TimeRange) => void;
    dateRange: { from: Date; to: Date };
    onDateRangeChange: (range: { from: Date; to: Date }) => void;
    label: string;
  }) => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline">{label}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">Last 7 Days</SelectItem>
          <SelectItem value="30days">Last 30 Days</SelectItem>
          <SelectItem value="90days">Last 90 Days</SelectItem>
          <SelectItem value="6months">Last 6 Months</SelectItem>
          <SelectItem value="1year">Last 1 Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>
      
      {value === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <CalendarIcon className="mr-1 h-3 w-3" />
              {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              <div className="text-sm font-medium mb-2">Select Date Range</div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={format(dateRange.from, 'yyyy-MM-dd')}
                  onChange={(e) => onDateRangeChange({ ...dateRange, from: new Date(e.target.value) })}
                  className="text-xs p-1 border rounded"
                />
                <span className="text-xs">to</span>
                <input
                  type="date"
                  value={format(dateRange.to, 'yyyy-MM-dd')}
                  onChange={(e) => onDateRangeChange({ ...dateRange, to: new Date(e.target.value) })}
                  className="text-xs p-1 border rounded"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Stats Grid */}
      <div className={`
        grid grid-cols-2 sm:grid-cols-3 lg:${isSuperAdmin ? 'grid-cols-4 xl:grid-cols-8' : 'grid-cols-4 xl:grid-cols-6'} 
        gap-3 sm:gap-4
      `}>
        {[
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'primary' },
          { label: 'Products', value: stats.totalProducts, icon: Package, color: 'purple' },
          { label: 'Total Quotes', value: stats.totalQuotes, icon: FileText, color: 'blue' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'warning' },
          { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'success' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'danger' },
          ...(isSuperAdmin ? [
            { label: 'Admins', value: stats.totalAdmins, icon: Shield, color: 'indigo' },
            { label: 'Super Admins', value: stats.totalSuperAdmins, icon: Shield, color: 'yellow' },
          ] : []),
        ].map((stat, index) => (
          <Card 
            key={index} 
            className={`bg-gradient-to-br ${colorClasses[stat.color]} shadow-card hover:shadow-lg transition-shadow`}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col items-center justify-center text-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${colorClasses[stat.color].split(' ')[6]}`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6`} />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl xl:text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section with Integrated Time Range Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Quote Status Distribution - Enhanced */}
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Quote Status Distribution
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground hidden sm:inline">Total:</span>
              <span className="font-bold text-primary">{stats.totalQuotes}</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="h-[240px] sm:h-[280px] flex items-center justify-center relative">
              {stats.totalQuotes > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={quoteStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        strokeWidth={2}
                      >
                        {quoteStatusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
                                  <p className="font-medium text-sm">{data.name}</p>
                                </div>
                                <p className="text-sm">{data.value} quotes</p>
                                <p className="text-xs text-muted-foreground">{data.percentage}% of total</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-2xl sm:text-3xl font-bold">{stats.totalQuotes}</p>
                    <p className="text-xs text-muted-foreground">Total Quotes</p>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No quotes yet</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {quoteStatusData.map((item) => (
                <div 
                  key={item.name} 
                  className="bg-gradient-to-r from-white to-gray-50 border border-border rounded-lg p-3 text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium truncate">{item.name}</span>
                  </div>
                  <p className="text-lg sm:text-xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quotes Trend - Enhanced with Time Range */}
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                Quote Requests
              </CardTitle>
              <TimeRangeSelector
                value={quoteTimeRange}
                onChange={setQuoteTimeRange}
                dateRange={quoteDateRange}
                onDateRangeChange={setQuoteDateRange}
                label="Time Range"
              />
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="h-[240px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quoteTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 30%, 90%)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(210, 20%, 45%)', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(210, 30%, 90%)' }}
                    tickMargin={8}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(210, 20%, 45%)', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(210, 30%, 90%)' }}
                    allowDecimals={false}
                    tickMargin={8}
                    width={30}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium mb-2">{data.fullDate}</p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm">Total:</span>
                                <span className="font-semibold">{data.total}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-amber-600">Pending:</span>
                                <span className="font-medium">{data.pending}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-green-600">Approved:</span>
                                <span className="font-medium">{data.approved}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-red-600">Rejected:</span>
                                <span className="font-medium">{data.rejected}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    dot={{ strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="approved" 
                    stroke={CHART_COLORS.success}
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-lg font-bold">
                  {quoteTrendData.length > 0 
                    ? Math.round(quoteTrendData.reduce((sum, day) => sum + day.total, 0) / quoteTrendData.length)
                    : 0}
                </p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Peak</p>
                <p className="text-lg font-bold">
                  {quoteTrendData.length > 0 
                    ? Math.max(...quoteTrendData.map(day => day.total))
                    : 0}
                </p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-lg font-bold">{dailyQuotes.today}</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Yesterday</p>
                <p className="text-lg font-bold">{dailyQuotes.yesterday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts with Integrated Time Range Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* User Registrations - Enhanced with Time Range */}
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                New User Registrations
              </CardTitle>
              <TimeRangeSelector
                value={userTimeRange}
                onChange={setUserTimeRange}
                dateRange={userDateRange}
                onDateRangeChange={setUserDateRange}
                label="Time Range"
              />
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="h-[200px] sm:h-[240px] lg:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userTrendData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 30%, 90%)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(210, 20%, 45%)', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(210, 30%, 90%)' }}
                    tickMargin={8}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(210, 20%, 45%)', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(210, 30%, 90%)' }}
                    allowDecimals={false}
                    tickMargin={8}
                    width={30}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.fullDate}</p>
                            <p className="text-lg font-bold mt-1">{data.users} new users</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke={CHART_COLORS.info}
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-xl font-bold">
                  {userTrendData.length > 1 
                    ? `${(((userTrendData[userTrendData.length - 1].users - userTrendData[0].users) / userTrendData[0].users) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">Total This Period</p>
                <p className="text-xl font-bold">
                  {userTrendData.reduce((sum, day) => sum + day.users, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Categories - Enhanced */}
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6 flex flex-row items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Products by Category
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground hidden sm:inline">Total:</span>
              <span className="font-bold text-primary">{stats.totalProducts}</span>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="h-[200px] sm:h-[240px] lg:h-[260px]">
              {products.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 30%, 90%)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(210, 20%, 45%)', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(210, 30%, 90%)' }}
                      tickMargin={8}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(210, 20%, 45%)', fontSize: 11 }}
                      axisLine={{ stroke: 'hsl(210, 30%, 90%)' }}
                      allowDecimals={false}
                      tickMargin={8}
                      width={30}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium mb-2">{data.fullName}</p>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Products:</span>
                                  <span className="font-bold">{data.value}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm">Percentage:</span>
                                  <span className="font-medium">{data.percentage}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[4, 4, 0, 0]}
                    >
                      {productCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No products yet</p>
                </div>
              )}
            </div>
            <div className="space-y-2 mt-4">
              {productCategoryData.map((category) => (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{category.fullName}</span>
                    <span className="text-sm text-muted-foreground">{category.value} ({category.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Quotes Details */}
      {dailyQuotes.today > 0 && (
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Today's Quote Requests ({dailyQuotes.today})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2">
              {dailyQuotes.todayDetails.map((quote) => (
                <div 
                  key={quote.id} 
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white border border-border rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{quote.subject || 'No Subject'}</p>
                    <p className="text-xs text-muted-foreground">{quote.time}</p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {quote.status === 'pending' && (
                      <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        Pending
                      </span>
                    )}
                    {quote.status === 'approved' && (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        Approved
                      </span>
                    )}
                    {quote.status === 'rejected' && (
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}