import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Chip,
  Paper,
  Typography,
  Alert,
} from '@mui/material';
import { CallEnd, PhoneInTalk } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { callsApi } from '../api/calls';

export default function LiveCallsPage() {
  const { data: channels, isLoading, error } = useQuery({
    queryKey: ['live-calls'],
    queryFn: callsApi.getLive,
    refetchInterval: 5000,
  });

  const columns: GridColDef[] = [
    {
      field: 'state',
      headerName: 'State',
      width: 120,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          icon={value === 'Up' ? <PhoneInTalk sx={{ fontSize: '14px !important' }} /> : undefined}
          label={value || 'Unknown'}
          color={value === 'Up' ? 'success' : 'warning'}
        />
      ),
    },
    {
      field: 'callerId',
      headerName: 'Caller',
      width: 140,
      renderCell: ({ value }) => (
        <Typography fontFamily="monospace" fontWeight={700}>
          {value || '-'}
        </Typography>
      ),
    },
    {
      field: 'extension',
      headerName: 'Extension',
      width: 130,
      renderCell: ({ value }) => (
        <Typography fontFamily="monospace" fontWeight={700}>
          {value || '-'}
        </Typography>
      ),
    },
    {
      field: 'application',
      headerName: 'Application',
      width: 150,
      renderCell: ({ value }) => value || '-',
    },
    {
      field: 'channel',
      headerName: 'Channel',
      flex: 1,
      minWidth: 240,
      renderCell: ({ value }) => (
        <Typography fontFamily="monospace" fontSize={12} noWrap>
          {value}
        </Typography>
      ),
    },
    {
      field: 'uniqueId',
      headerName: 'Unique ID',
      width: 160,
      renderCell: ({ value }) => (
        <Typography fontFamily="monospace" fontSize={12}>
          {value || '-'}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Live Calls</Typography>
          <Typography variant="body2" color="text.secondary">
            {channels?.length ?? 0} active Asterisk channel{channels?.length === 1 ? '' : 's'}
          </Typography>
        </Box>
        <Chip
          icon={<CallEnd sx={{ fontSize: '14px !important' }} />}
          label="AMI"
          color={error ? 'error' : 'primary'}
          variant="outlined"
        />
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Live channel data is unavailable. Check AMI connectivity.
        </Alert>
      )}

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={channels ?? []}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row.uniqueId || row.channel}
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 0 }}
        />
      </Paper>
    </Box>
  );
}
