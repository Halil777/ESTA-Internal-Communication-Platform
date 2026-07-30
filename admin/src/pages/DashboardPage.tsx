import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Skeleton,
  Alert,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Dialpad,
  PhoneInTalk,
  PhoneAndroid,
  CheckCircle,
  Cancel,
  Circle,
  Storage,
  Timer,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { systemApi } from '../api/system';

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary.main',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: `${color}22`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </Paper>
  );
}

const COLORS = ['#4caf50', '#f44336'];

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: systemApi.getDashboard,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>
          Dashboard
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Skeleton variant="rounded" height={110} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load dashboard. Check the backend connection.</Alert>;
  }

  const pieData = [
    { name: 'Completed', value: stats?.calls?.completed ?? 0 },
    { name: 'Missed', value: stats?.calls?.missed ?? 0 },
  ];

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const pbxConnected = stats?.pbx?.connected ?? false;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Dashboard
        </Typography>
        <Chip
          icon={pbxConnected ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
          label={pbxConnected ? 'PBX Connected' : 'PBX Offline'}
          color={pbxConnected ? 'success' : 'error'}
          variant="outlined"
        />
      </Box>

      {/* Stats cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Extensions"
            value={stats?.extensions?.total ?? 0}
            subtitle={`${stats?.devices?.sipRegistered ?? 0} online extensions`}
            icon={<Dialpad />}
            color="#1565c0"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Calls"
            value={stats?.pbx?.activeCalls ?? 0}
            subtitle={`${stats?.extensions?.inUse ?? 0} in use`}
            icon={<PhoneInTalk />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Calls Today"
            value={stats?.calls?.today ?? 0}
            subtitle={`${stats?.calls?.missedToday ?? 0} missed today`}
            icon={<PhoneInTalk />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Registered Devices"
            value={stats?.devices?.total ?? 0}
            subtitle={`${stats?.devices?.sipRegistered ?? 0} SIP active`}
            icon={<PhoneAndroid />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Average Duration"
            value={formatDuration(stats?.calls?.averageDurationSeconds)}
            subtitle={`${stats?.calls?.completed ?? 0} completed calls`}
            icon={<Timer />}
            color="#00897b"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Recording Storage"
            value={formatBytes(stats?.recordings?.sizeBytes)}
            subtitle={`${stats?.recordings?.total ?? 0} recordings`}
            icon={<Storage />}
            color="#6d4c41"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Server metrics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Server Resources
            </Typography>

            <Box mb={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">CPU Usage</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {stats?.server.cpuUsage?.toFixed(1) ?? 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(stats?.server.cpuUsage ?? 0, 100)}
                color={(stats?.server.cpuUsage ?? 0) > 80 ? 'error' : 'primary'}
                sx={{ borderRadius: 1, height: 8 }}
              />
            </Box>

            <Box mb={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Memory Usage</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {stats?.server.memoryUsedPct?.toFixed(1) ?? 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(stats?.server.memoryUsedPct ?? 0, 100)}
                color={(stats?.server.memoryUsedPct ?? 0) > 85 ? 'error' : 'success'}
                sx={{ borderRadius: 1, height: 8 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Uptime</Typography>
              <Typography variant="body2" fontWeight={600}>
                {stats?.server.uptime ? formatUptime(stats.server.uptime) : '-'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2" color="text.secondary">Node.js</Typography>
              <Typography variant="body2" fontWeight={600}>{stats?.server.nodeVersion}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Call breakdown */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Call Overview
            </Typography>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Services status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Services
            </Typography>
            {[
              { label: 'Backend API', ok: true, detail: 'Port 3001' },
              { label: 'PostgreSQL DB', ok: true, detail: 'Port 5432' },
              { label: 'Redis Cache', ok: true, detail: '127.0.0.1:6379' },
              { label: 'Asterisk PBX', ok: pbxConnected, detail: 'AMI Port 5038' },
              { label: 'WebSocket', ok: true, detail: '/ws' },
            ].map((svc) => (
              <Box
                key={svc.label}
                sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
              >
                <Circle sx={{ fontSize: 10, color: svc.ok ? 'success.main' : 'error.main', mr: 1.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>{svc.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{svc.detail}</Typography>
                </Box>
                <Chip label={svc.ok ? 'OK' : 'Down'} size="small" color={svc.ok ? 'success' : 'error'} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
