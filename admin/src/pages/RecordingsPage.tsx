import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Chip,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { GraphicEq } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { recordingsApi } from '../api/recordings';
import { RecordingStatus } from '../types';

const statusColor: Record<RecordingStatus, 'success' | 'warning' | 'error' | 'default'> = {
  [RecordingStatus.AVAILABLE]: 'success',
  [RecordingStatus.ARCHIVED]: 'warning',
  [RecordingStatus.DELETED]: 'default',
  [RecordingStatus.FAILED]: 'error',
};

function formatDuration(seconds?: number) {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatBytes(value?: string) {
  const bytes = Number(value ?? 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return '-';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function RecordingsPage() {
  const [filters, setFilters] = useState({
    extension: '',
    from: '',
    to: '',
  });

  const { data: recordings, isLoading } = useQuery({
    queryKey: ['recordings', filters],
    queryFn: () =>
      recordingsApi.getAll({
        extension: filters.extension || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      }),
  });

  const columns: GridColDef[] = [
    {
      field: 'callerExtension',
      headerName: 'Caller',
      width: 120,
      renderCell: ({ value }) => (
        <Typography fontFamily="monospace" fontWeight={700}>
          {value}
        </Typography>
      ),
    },
    {
      field: 'calleeExtension',
      headerName: 'Receiver',
      width: 120,
      renderCell: ({ value }) => (
        <Typography fontFamily="monospace" fontWeight={700}>
          {value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={statusColor[value as RecordingStatus]} />
      ),
    },
    {
      field: 'durationSeconds',
      headerName: 'Duration',
      width: 110,
      renderCell: ({ value }) => (
        <Typography fontFamily="monospace" variant="body2">
          {formatDuration(value)}
        </Typography>
      ),
    },
    {
      field: 'sizeBytes',
      headerName: 'Size',
      width: 100,
      renderCell: ({ value }) => formatBytes(value),
    },
    {
      field: 'fileName',
      headerName: 'File',
      flex: 1,
      minWidth: 220,
      renderCell: ({ value }) => (
        <Typography fontFamily="monospace" fontSize={12} noWrap>
          {value}
        </Typography>
      ),
    },
    {
      field: 'startedAt',
      headerName: 'Date & Time',
      width: 170,
      renderCell: ({ value }) => dayjs(value).format('MMM D, YYYY HH:mm'),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Recordings</Typography>
          <Typography variant="body2" color="text.secondary">
            {recordings?.length ?? 0} recording metadata records
          </Typography>
        </Box>
        <Chip icon={<GraphicEq />} label="WAV / archive ready" color="primary" variant="outlined" />
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Extension"
              size="small"
              fullWidth
              value={filters.extension}
              onChange={(e) => setFilters((f) => ({ ...f, extension: e.target.value.replace(/\D/g, '') }))}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
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
          <Grid item xs={12} sm={4}>
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
          rows={recordings ?? []}
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
