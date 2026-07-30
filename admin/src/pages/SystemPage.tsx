import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  Button,
  Skeleton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  Storage,
  Memory,
  Router,
  Circle,
} from '@mui/icons-material';
import { systemApi } from '../api/system';

export default function SystemPage() {
  const {
    data: stats,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['system-dashboard'],
    queryFn: systemApi.getDashboard,
    refetchInterval: 15000,
  });

  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: systemApi.getHealth,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h5" fontWeight={700} mb={3}>System</Typography>
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rounded" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Failed to load system status. Is the backend running?</Alert>;
  }

  const pbxConnected = stats?.pbx.connected ?? false;
  const pbx = stats?.pbx;
  const backendOrigin = window.location.origin;
  const wsOrigin = backendOrigin.replace(/^http/, 'ws');

  const formatUptime = (seconds?: number) => {
    if (!seconds) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const services = [
    { name: 'Backend API', ok: true, detail: `${backendOrigin}/api/v1` },
    { name: 'PostgreSQL', ok: health?.database ?? true, detail: 'Port 5432' },
    { name: 'Redis Cache', ok: health?.redis ?? false, detail: '127.0.0.1:6379' },
    { name: 'WebSocket', ok: true, detail: `${wsOrigin}/ws` },
    { name: 'Asterisk PBX', ok: pbxConnected, detail: `${pbx?.amiHost ?? '-'}:${pbx?.amiPort ?? '-'}` },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>System Status</Typography>
        <Button startIcon={<Refresh />} onClick={() => refetch()} variant="outlined" size="small">
          Refresh
        </Button>
      </Box>

      <Grid container spacing={2}>
        {/* Server Resources */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Memory color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>Server Resources</Typography>
            </Box>

            <Box mb={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">CPU Usage</Typography>
                <Typography variant="body2" fontWeight={700}>{stats?.server.cpuUsage?.toFixed(1) ?? 0}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(stats?.server.cpuUsage ?? 0, 100)}
                color={(stats?.server.cpuUsage ?? 0) > 90 ? 'error' : (stats?.server.cpuUsage ?? 0) > 70 ? 'warning' : 'primary'}
                sx={{ height: 10, borderRadius: 1 }}
              />
            </Box>

            <Box mb={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">Memory Usage</Typography>
                <Typography variant="body2" fontWeight={700}>{stats?.server.memoryUsedPct?.toFixed(1) ?? 0}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(stats?.server.memoryUsedPct ?? 0, 100)}
                color={(stats?.server.memoryUsedPct ?? 0) > 90 ? 'error' : 'success'}
                sx={{ height: 10, borderRadius: 1 }}
              />
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <List dense disablePadding>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText primary="Uptime" secondary={formatUptime(stats?.server.uptime)} />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText primary="RAM Total" secondary={`${stats?.server.memoryTotal ?? 0} MB`} />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText primary="CPU Cores" secondary={stats?.server.cpuCores} />
              </ListItem>
              <ListItem disablePadding sx={{ py: 0.25 }}>
                <ListItemText primary="Node.js" secondary={stats?.server.nodeVersion} />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* PBX Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Router color={pbxConnected ? 'success' : 'error'} />
              <Typography variant="subtitle1" fontWeight={600}>Asterisk PBX</Typography>
              <Chip
                label={pbxConnected ? 'Connected' : 'Offline'}
                size="small"
                color={pbxConnected ? 'success' : 'error'}
                icon={pbxConnected ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <Cancel sx={{ fontSize: '14px !important' }} />}
                sx={{ ml: 'auto' }}
              />
            </Box>

            {!pbxConnected && (
              <Alert severity="warning" sx={{ mb: 2, fontSize: 12 }}>
                PBX not connected. Calls and SIP registration will not work.
              </Alert>
            )}

            <List dense disablePadding>
              {[
                { label: 'SIP Domain', value: pbx?.sipDomain ?? '-' },
                { label: 'AMI Host', value: `${pbx?.amiHost ?? '-'}:${pbx?.amiPort ?? '-'}` },
                { label: 'SIP Port', value: `${pbx?.sipPort ?? '-'} (${pbx?.sipTransport ?? '-'})` },
                { label: 'Active Calls', value: String(stats?.pbx.activeCalls ?? 0) },
                { label: 'Status', value: stats?.pbx.status ?? '-' },
              ].map((item) => (
                <ListItem key={item.label} disablePadding sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={item.label}
                    secondary={item.value}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    secondaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Services */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Storage color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>Services</Typography>
            </Box>

            {services.map((svc) => (
              <Box
                key={svc.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                <Circle sx={{ fontSize: 10, color: svc.ok ? 'success.main' : 'error.main', mr: 1.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>{svc.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{svc.detail}</Typography>
                </Box>
                <Chip label={svc.ok ? 'OK' : 'Down'} size="small" color={svc.ok ? 'success' : 'error'} />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Platform stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Platform Overview</Typography>
            <Grid container spacing={3}>
              {[
                { label: 'Total Users', value: stats?.users.total ?? 0 },
                { label: 'Active Users', value: stats?.users.active ?? 0 },
                { label: 'Online Now', value: stats?.users.online ?? 0 },
                { label: 'Total Extensions', value: stats?.extensions?.total ?? 0 },
                { label: 'Extensions In Use', value: stats?.extensions?.inUse ?? 0 },
                { label: 'Registered Devices', value: stats?.devices.registered ?? 0 },
                { label: 'SIP Active', value: stats?.devices.sipRegistered ?? 0 },
                { label: 'Total Calls', value: stats?.calls.total ?? 0 },
                { label: 'Recordings', value: stats?.recordings?.total ?? 0 },
              ].map((item) => (
                <Grid item xs={6} sm={3} key={item.label}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} color="primary.main">{item.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
