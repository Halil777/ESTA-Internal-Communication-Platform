import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Paper,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Add,
  PhoneLocked,
  PhoneEnabled,
  LinkOff,
  Link as LinkIcon,
  VpnKey,
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { extensionsApi } from '../api/extensions';
import { usersApi } from '../api/users';
import { ExtensionStatus, type Extension } from '../types';

const statusColor: Record<ExtensionStatus, 'default' | 'success' | 'warning' | 'error'> = {
  [ExtensionStatus.ACTIVE]: 'success',
  [ExtensionStatus.INACTIVE]: 'default',
  [ExtensionStatus.RESERVED]: 'warning',
  [ExtensionStatus.DISABLED]: 'error',
};

export default function ExtensionsPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<Extension | null>(null);
  const [resetSecret, setResetSecret] = useState<{
    extension: string;
    username: string;
    password: string;
    domain: string;
    transport: string;
    port: number;
  } | null>(null);
  const [newNumber, setNewNumber] = useState('');
  const [assignUserId, setAssignUserId] = useState('');

  const { data: extensions, isLoading } = useQuery({
    queryKey: ['extensions'],
    queryFn: extensionsApi.getAll,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const reserveMutation = useMutation({
    mutationFn: (number: string) => extensionsApi.reserve(number),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['extensions'] });
      enqueueSnackbar('Extension reserved', { variant: 'success' });
      setCreateOpen(false);
      setNewNumber('');
    },
    onError: (e: any) =>
      enqueueSnackbar(e?.response?.data?.message || 'Failed to reserve extension', { variant: 'error' }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ extensionNumber, userId }: { extensionNumber: string; userId: string }) =>
      extensionsApi.assign(extensionNumber, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['extensions'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('Extension assigned', { variant: 'success' });
      setAssignOpen(null);
      setAssignUserId('');
    },
    onError: (e: any) =>
      enqueueSnackbar(e?.response?.data?.message || 'Failed to assign', { variant: 'error' }),
  });

  const releaseMutation = useMutation({
    mutationFn: (extensionNumber: string) => extensionsApi.release(extensionNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['extensions'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('Extension released', { variant: 'info' });
    },
    onError: () => enqueueSnackbar('Failed to release', { variant: 'error' }),
  });

  const disableMutation = useMutation({
    mutationFn: (extensionNumber: string) => extensionsApi.disable(extensionNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['extensions'] });
      enqueueSnackbar('Extension disabled', { variant: 'warning' });
    },
    onError: () => enqueueSnackbar('Failed to disable', { variant: 'error' }),
  });

  const enableMutation = useMutation({
    mutationFn: (extensionNumber: string) => extensionsApi.enable(extensionNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['extensions'] });
      enqueueSnackbar('Extension enabled', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to enable', { variant: 'error' }),
  });

  const resetSecretMutation = useMutation({
    mutationFn: (extensionNumber: string) => extensionsApi.resetSecret(extensionNumber),
    onSuccess: (data) => {
      setResetSecret(data);
      enqueueSnackbar('SIP secret reset', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to reset SIP secret', { variant: 'error' }),
  });

  const columns: GridColDef[] = [
    {
      field: 'extensionNumber',
      headerName: 'Extension',
      width: 120,
      renderCell: ({ value }) => (
        <Typography fontFamily="monospace" fontWeight={700} fontSize={18}>
          {value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }) => (
        <Chip label={value} size="small" color={statusColor[value as ExtensionStatus]} />
      ),
    },
    {
      field: 'user',
      headerName: 'Assigned To',
      flex: 1,
      minWidth: 180,
      renderCell: ({ value }) =>
        value ? (
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {value.firstName} {value.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{value.username} · {value.employeeId}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">Unassigned</Typography>
        ),
    },
    {
      field: 'allowIncomingCalls',
      headerName: 'Incoming',
      width: 100,
      renderCell: ({ value }) => (
        <Chip label={value ? 'Yes' : 'No'} size="small" color={value ? 'success' : 'default'} />
      ),
    },
    {
      field: 'allowOutgoingCalls',
      headerName: 'Outgoing',
      width: 100,
      renderCell: ({ value }) => (
        <Chip label={value ? 'Yes' : 'No'} size="small" color={value ? 'success' : 'default'} />
      ),
    },
    {
      field: 'recordCalls',
      headerName: 'Record',
      width: 100,
      renderCell: ({ value }) => (
        <Chip label={value ? 'On' : 'Off'} size="small" color={value ? 'warning' : 'default'} />
      ),
    },
    {
      field: 'forwardTo',
      headerName: 'Forward To',
      width: 120,
      renderCell: ({ value }) =>
        value ? (
          <Typography fontFamily="monospace" fontWeight={600}>{value}</Typography>
        ) : '-',
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 130,
      getActions: ({ row }) => {
        const num = row.extensionNumber;
        const acts = [];

        if (!row.userId && !row.isReserved && row.status !== ExtensionStatus.DISABLED) {
          acts.push(
            <GridActionsCellItem
              key="assign"
              icon={<LinkIcon />}
              label="Assign to user"
              onClick={() => setAssignOpen(row)}
            />
          );
        }
        if (row.userId) {
          acts.push(
            <GridActionsCellItem
              key="release"
              icon={<LinkOff />}
              label="Release"
              onClick={() => releaseMutation.mutate(num)}
            />
          );
          acts.push(
            <GridActionsCellItem
              key="reset-secret"
              icon={<VpnKey />}
              label="Reset SIP secret"
              onClick={() => resetSecretMutation.mutate(num)}
            />
          );
        }
        if (row.status === ExtensionStatus.DISABLED) {
          acts.push(
            <GridActionsCellItem
              key="enable"
              icon={<PhoneEnabled />}
              label="Enable"
              onClick={() => enableMutation.mutate(num)}
            />
          );
        } else if (!row.isReserved) {
          acts.push(
            <GridActionsCellItem
              key="disable"
              icon={<PhoneLocked />}
              label="Disable"
              onClick={() => disableMutation.mutate(num)}
            />
          );
        }
        return acts;
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Extensions
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Reserve Extension
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={extensions ?? []}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 0 }}
        />
      </Paper>

      {/* Reserve Extension Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reserve Extension Number</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Reserved extensions are blocked from assignment until released.
          </Alert>
          <TextField
            label="Extension Number (3-5 digits)"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value.replace(/\D/g, ''))}
            fullWidth
            inputProps={{ maxLength: 5 }}
            placeholder="e.g. 100"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateOpen(false); setNewNumber(''); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => reserveMutation.mutate(newNumber)}
            disabled={newNumber.length < 3 || reserveMutation.isPending}
          >
            Reserve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Extension Dialog */}
      <Dialog open={!!assignOpen} onClose={() => setAssignOpen(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Extension {assignOpen?.extensionNumber}</DialogTitle>
        <DialogContent>
          <TextField
            label="Select User"
            select
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
            fullWidth
            sx={{ mt: 1 }}
          >
            {users
              ?.filter((u) => !u.extension && u.isActive)
              .map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} (@{u.username})
                </MenuItem>
              ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAssignOpen(null); setAssignUserId(''); }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() =>
              assignOpen &&
              assignMutation.mutate({ extensionNumber: assignOpen.extensionNumber, userId: assignUserId })
            }
            disabled={!assignUserId || assignMutation.isPending}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!resetSecret} onClose={() => setResetSecret(null)} maxWidth="sm" fullWidth>
        <DialogTitle>SIP Secret Reset</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Store this secret now. It will not be shown again.
          </Alert>
          {[
            ['Extension', resetSecret?.extension],
            ['Username', resetSecret?.username],
            ['Password', resetSecret?.password],
            ['Server', `${resetSecret?.domain}:${resetSecret?.port}`],
            ['Transport', resetSecret?.transport],
          ].map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', gap: 2, py: 0.75 }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: 90 }}>
                {label}
              </Typography>
              <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                {value}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setResetSecret(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
