import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Chip,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { Block, Wifi, WifiOff } from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { devicesApi } from '../api/devices';
import { DeviceStatus, type Device } from '../types';

const statusColor: Record<DeviceStatus, 'success' | 'error' | 'warning'> = {
  [DeviceStatus.ACTIVE]: 'success',
  [DeviceStatus.REVOKED]: 'error',
  [DeviceStatus.PENDING]: 'warning',
};

export default function DevicesPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [confirmRevoke, setConfirmRevoke] = useState<Device | null>(null);

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: devicesApi.getAll,
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => devicesApi.revoke(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] });
      enqueueSnackbar('Device revoked — user will be logged out', { variant: 'warning' });
      setConfirmRevoke(null);
    },
    onError: () => enqueueSnackbar('Failed to revoke device', { variant: 'error' }),
  });

  const columns: GridColDef[] = [
    {
      field: 'brand',
      headerName: 'Device',
      width: 180,
      renderCell: ({ row }) => (
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {row.brand} {row.model}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.platform ?? 'ANDROID'} · {row.deviceType ?? 'ANDROID_PHONE'} · App {row.appVersion}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'extension',
      headerName: 'Extension',
      width: 110,
      renderCell: ({ row }) => (
        <Typography fontFamily="monospace" fontWeight={700}>
          {row.extension?.extensionNumber ?? '-'}
        </Typography>
      ),
    },
    {
      field: 'user',
      headerName: 'User',
      flex: 1,
      minWidth: 160,
      renderCell: ({ value }) =>
        value ? (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {value.firstName} {value.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{value.username}
            </Typography>
          </Box>
        ) : '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={statusColor[value as DeviceStatus]} />
      ),
    },
    {
      field: 'sipRegistered',
      headerName: 'SIP',
      width: 110,
      renderCell: ({ value }) =>
        value ? (
          <Chip icon={<Wifi sx={{ fontSize: '14px !important' }} />} label="Registered" size="small" color="success" />
        ) : (
          <Chip icon={<WifiOff sx={{ fontSize: '14px !important' }} />} label="Offline" size="small" color="default" />
        ),
    },
    {
      field: 'lastIp',
      headerName: 'Last IP',
      width: 130,
      renderCell: ({ value }) => (
        <Typography fontFamily="monospace" fontSize={12}>
          {value || '-'}
        </Typography>
      ),
    },
    {
      field: 'wifiSsid',
      headerName: 'Wi-Fi',
      width: 130,
      renderCell: ({ value }) => value || '-',
    },
    {
      field: 'lastSeenAt',
      headerName: 'Last Seen',
      width: 140,
      renderCell: ({ value }) => (value ? dayjs(value).format('MMM D, HH:mm') : '-'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 80,
      getActions: ({ row }) =>
        row.status === DeviceStatus.ACTIVE
          ? [
              <GridActionsCellItem
                key="revoke"
                icon={<Block />}
                label="Revoke"
                onClick={() => setConfirmRevoke(row)}
              />,
            ]
          : [],
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Devices</Typography>
        <Typography variant="body2" color="text.secondary">
          All registered Android devices
        </Typography>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={devices ?? []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 0 }}
        />
      </Paper>

      <Dialog open={!!confirmRevoke} onClose={() => setConfirmRevoke(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Revoke Device Access</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            The user will be immediately logged out and must scan a new QR code to re-activate.
          </Alert>
          <Typography variant="body2">
            Device: <strong>{confirmRevoke?.brand} {confirmRevoke?.model}</strong>
            <br />
            User: <strong>{confirmRevoke?.user?.firstName} {confirmRevoke?.user?.lastName}</strong>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRevoke(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => confirmRevoke && revokeMutation.mutate(confirmRevoke.id)}
            disabled={revokeMutation.isPending}
          >
            Revoke Access
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
