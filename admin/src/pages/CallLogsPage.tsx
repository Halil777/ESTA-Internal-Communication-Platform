import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Chip,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  CallReceived,
  CallMade,
  PhoneMissed,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { callsApi } from '../api/calls';
import { CallStatus, CallDirection } from '../types';

const statusColor: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  INITIATED: 'default',
  RINGING: 'warning',
  ANSWERED: 'success',
  COMPLETED: 'success',
  MISSED: 'error',
  REJECTED: 'warning',
  BUSY: 'warning',
  CANCELLED: 'default',
  TIMEOUT: 'default',
  FAILED: 'default',
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

export default function CallLogsPage() {
  const [filters, setFilters] = useState({
    direction: '',
    status: '',
    extension: '',
    from: '',
    to: '',
  });

  const { data: calls, isLoading } = useQuery({
    queryKey: ['calls-admin', filters],
    queryFn: () =>
      callsApi.getAdminHistory({
        direction: filters.direction || undefined,
        status: filters.status || undefined,
        extension: filters.extension || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }),
  });

  const columns: GridColDef[] = [
    {
      field: 'direction',
      headerName: '',
      width: 44,
      renderCell: ({ value }) =>
        value === CallDirection.INCOMING ? (
          <CallReceived sx={{ fontSize: 16, color: 'success.main' }} />
        ) : value === CallDirection.INTERNAL ? (
          <PhoneMissed sx={{ fontSize: 16, color: 'warning.main' }} />
        ) : (
          <CallMade sx={{ fontSize: 16, color: 'primary.main' }} />
        ),
    },
    {
      field: 'callerExtension',
      headerName: 'From',
      width: 130,
      renderCell: ({ row }) => (
        <Box>
          <Typography fontFamily="monospace" fontWeight={700} fontSize={15}>
            {row.callerExtension}
          </Typography>
          {row.callerUser && (
            <Typography variant="caption" color="text.secondary">
              {row.callerUser.firstName} {row.callerUser.lastName}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'calleeExtension',
      headerName: 'To',
      width: 130,
      renderCell: ({ row }) => (
        <Box>
          <Typography fontFamily="monospace" fontWeight={700} fontSize={15}>
            {row.calleeExtension}
          </Typography>
          {row.calleeUser && (
            <Typography variant="caption" color="text.secondary">
              {row.calleeUser.firstName} {row.calleeUser.lastName}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          color={statusColor[value as string] ?? 'default'}
          icon={value === CallStatus.MISSED ? <PhoneMissed sx={{ fontSize: '14px !important' }} /> : undefined}
        />
      ),
    },
    {
      field: 'durationSeconds',
      headerName: 'Duration',
      width: 100,
      renderCell: ({ value }) => (
        <Typography variant="body2" fontFamily="monospace">
          {formatDuration(value)}
        </Typography>
      ),
    },
    {
      field: 'startedAt',
      headerName: 'Date & Time',
      flex: 1,
      minWidth: 160,
      renderCell: ({ value }) => dayjs(value).format('MMM D, YYYY HH:mm'),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Call Logs</Typography>
        <Typography variant="body2" color="text.secondary">
          All call records across the platform
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Direction"
              select
              size="small"
              fullWidth
              value={filters.direction}
              onChange={(e) => setFilters((f) => ({ ...f, direction: e.target.value }))}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={CallDirection.INCOMING}>Incoming</MenuItem>
              <MenuItem value={CallDirection.OUTGOING}>Outgoing</MenuItem>
              <MenuItem value={CallDirection.INTERNAL}>Internal</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Status"
              select
              size="small"
              fullWidth
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <MenuItem value="">All</MenuItem>
              {Object.values(CallStatus).map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Extension"
              size="small"
              fullWidth
              value={filters.extension}
              onChange={(e) => setFilters((f) => ({ ...f, extension: e.target.value.replace(/\D/g, '') }))}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="From Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="To Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={calls ?? []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[25, 50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 0 }}
        />
      </Paper>
    </Box>
  );
}
