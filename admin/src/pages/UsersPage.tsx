import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  MenuItem,
  Alert,
  Typography,
  Avatar,
  Stack,
  Paper,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Block,
  CheckCircle,
  Delete as DeleteIcon,
  Edit,
  LockReset,
  QrCode2,
  Search,
  Circle,
} from '@mui/icons-material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { QRCodeSVG } from 'qrcode.react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import { usersApi } from '../api/users';
import type { CreateUserDto, UpdateUserDto } from '../api/users';
import { departmentsApi } from '../api/departments';
import { UserRole, UserPresence, type User } from '../types';

const ROLES = Object.values(UserRole);

const createSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  username: z.string().min(3, 'Min 3 chars').max(30),
  employeeId: z.string().min(1, 'Employee ID required'),
  password: z.string().min(8, 'Min 8 chars'),
  email: z.string().email().optional().or(z.literal('')),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().optional(),
  cabinet: z.string().optional(),
  extensionNumber: z.string().regex(/^\d{3,5}$/, 'Must be 3-5 digits').optional().or(z.literal('')),
});

type CreateForm = z.infer<typeof createSchema>;

const editSchema = createSchema.omit({ password: true });

type EditForm = z.infer<typeof editSchema>;

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Min 8 chars'),
});

type PasswordForm = z.infer<typeof passwordSchema>;

const roleColor: Record<UserRole, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  [UserRole.SUPER_ADMIN]: 'error',
  [UserRole.OFFICE_ADMIN]: 'warning',
  [UserRole.MANAGER]: 'info',
  [UserRole.EMPLOYEE]: 'default',
  [UserRole.RECEPTION]: 'secondary',
};

const presenceColor: Record<UserPresence, string> = {
  [UserPresence.ONLINE]: '#4caf50',
  [UserPresence.OFFLINE]: '#9e9e9e',
  [UserPresence.BUSY]: '#f44336',
  [UserPresence.IN_CALL]: '#2196f3',
  [UserPresence.DO_NOT_DISTURB]: '#f44336',
  [UserPresence.AWAY]: '#ff9800',
  [UserPresence.MEETING]: '#9c27b0',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [qrUser, setQrUser] = useState<{ user: User; code: string } | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateUserDto) => usersApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User created successfully', { variant: 'success' });
      setCreateOpen(false);
      reset();
    },
    onError: (e: any) =>
      enqueueSnackbar(e?.response?.data?.message || 'Failed to create user', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) => usersApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User updated successfully', { variant: 'success' });
      setEditUser(null);
      resetEdit();
    },
    onError: (e: any) =>
      enqueueSnackbar(e?.response?.data?.message || 'Failed to update user', { variant: 'error' }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersApi.resetPassword(id, newPassword),
    onSuccess: () => {
      enqueueSnackbar('Password updated successfully', { variant: 'success' });
      setPasswordUser(null);
      resetPasswordForm();
    },
    onError: (e: any) =>
      enqueueSnackbar(e?.response?.data?.message || 'Failed to update password', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User deleted', { variant: 'success' });
      setDeleteUser(null);
    },
    onError: (e: any) =>
      enqueueSnackbar(e?.response?.data?.message || 'Failed to delete user', { variant: 'error' }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User deactivated', { variant: 'info' });
    },
    onError: () => enqueueSnackbar('Failed to deactivate user', { variant: 'error' }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => usersApi.activate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User activated', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Failed to activate user', { variant: 'error' }),
  });

  const generateQrMutation = useMutation({
    mutationFn: (user: User) =>
      usersApi.generateActivationCode(user.id).then((r) => ({ user, code: r.activationCode })),
    onSuccess: ({ user, code }) => {
      setQrUser({ user, code });
    },
    onError: () => enqueueSnackbar('Failed to generate code', { variant: 'error' }),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: UserRole.EMPLOYEE },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    control: editControl,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { role: UserRole.EMPLOYEE },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = (data: CreateForm) => {
    createMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      employeeId: data.employeeId,
      password: data.password,
      email: data.email || undefined,
      role: data.role,
      departmentId: data.departmentId,
      cabinet: data.cabinet,
      extensionNumber: data.extensionNumber || undefined,
    });
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    resetEdit({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      employeeId: user.employeeId,
      email: user.email ?? '',
      role: user.role,
      departmentId: user.department?.id ?? '',
      cabinet: user.cabinet ?? '',
      extensionNumber: user.extension?.extensionNumber ?? '',
    });
  };

  const onEditSubmit = (data: EditForm) => {
    if (!editUser) return;
    updateMutation.mutate({
      id: editUser.id,
      dto: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        employeeId: data.employeeId,
        email: data.email || undefined,
        role: data.role,
        departmentId: data.departmentId || '',
        cabinet: data.cabinet || '',
        extensionNumber: data.extensionNumber || '',
      },
    });
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    if (!passwordUser) return;
    resetPasswordMutation.mutate({ id: passwordUser.id, newPassword: data.newPassword });
  };

  const filtered = users?.filter(
    (u) =>
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(search.toLowerCase()),
  ) ?? [];

  const columns: GridColDef[] = [
    {
      field: 'fullName',
      headerName: 'Name',
      flex: 1,
      minWidth: 180,
      valueGetter: (_v, row) => row.fullName || `${row.firstName} ${row.lastName}`,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.light' }}>
              {row.firstName?.charAt(0)}
            </Avatar>
            <Circle
              sx={{
                fontSize: 10,
                color: presenceColor[row.status as UserPresence] ?? '#9e9e9e',
                position: 'absolute',
                bottom: -1,
                right: -1,
                bgcolor: 'background.paper',
                borderRadius: '50%',
              }}
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {row.firstName} {row.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              @{row.username} · {row.employeeId}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 140,
      renderCell: ({ value }) => (
        <Chip label={value?.replace('_', ' ')} size="small" color={roleColor[value as UserRole]} />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: ({ value }) => (
        <Chip label={value ? 'Active' : 'Inactive'} size="small" color={value ? 'success' : 'default'} />
      ),
    },
    {
      field: 'extension',
      headerName: 'Extension',
      width: 110,
      renderCell: ({ value }) =>
        value ? (
          <Chip label={value.extensionNumber} size="small" variant="outlined" color="primary" />
        ) : (
          <Typography variant="caption" color="text.secondary">None</Typography>
        ),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
      renderCell: ({ value }) => value?.name || '-',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 110,
      renderCell: ({ value }) => dayjs(value).format('MMM D, YYYY'),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 180,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Edit"
          onClick={() => openEdit(row)}
          showInMenu
        />,
        <GridActionsCellItem
          key="password"
          icon={<LockReset />}
          label="Reset Password"
          onClick={() => {
            setPasswordUser(row);
            resetPasswordForm();
          }}
          showInMenu
        />,
        <GridActionsCellItem
          key="qr"
          icon={<QrCode2 />}
          label="Generate QR"
          onClick={() => generateQrMutation.mutate(row)}
          showInMenu
        />,
        row.isActive ? (
          <GridActionsCellItem
            key="deactivate"
            icon={<Block />}
            label="Deactivate"
            onClick={() => deactivateMutation.mutate(row.id)}
            showInMenu
          />
        ) : (
          <GridActionsCellItem
            key="activate"
            icon={<CheckCircle />}
            label="Activate"
            onClick={() => activateMutation.mutate(row.id)}
            showInMenu
          />
        ),
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => setDeleteUser(row)}
          showInMenu
        />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Users
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Add User
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name, username or employee ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 360 }}
        />
      </Paper>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={isLoading}
          pageSizeOptions={[25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 0 }}
        />
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="create-user-form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  {...register('firstName')}
                  label="First Name"
                  fullWidth
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register('lastName')}
                  label="Last Name"
                  fullWidth
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  {...register('username')}
                  label="Username"
                  fullWidth
                  error={!!errors.username}
                  helperText={errors.username?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register('employeeId')}
                  label="Employee ID"
                  fullWidth
                  placeholder="EMP-001"
                  error={!!errors.employeeId}
                  helperText={errors.employeeId?.message}
                />
              </Grid>
            </Grid>
            <TextField
              {...register('password')}
              label="Password"
              type="password"
              fullWidth
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <TextField
              {...register('email')}
              label="Email (optional)"
              fullWidth
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  {...register('cabinet')}
                  label="Cabinet / Room (optional)"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...register('extensionNumber')}
                  label="Extension Number (optional)"
                  fullWidth
                  placeholder="e.g. 100"
                  error={!!errors.extensionNumber}
                  helperText={errors.extensionNumber?.message}
                />
              </Grid>
            </Grid>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Role" select fullWidth>
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="departmentId"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Department (optional)" select fullWidth>
                  <MenuItem value="">None</MenuItem>
                  {departments?.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
          <Button
            type="submit"
            form="create-user-form"
            variant="contained"
            disabled={isSubmitting || createMutation.isPending}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={!!editUser}
        onClose={() => {
          setEditUser(null);
          resetEdit();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="edit-user-form"
            onSubmit={handleEditSubmit(onEditSubmit)}
            sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  {...registerEdit('firstName')}
                  label="First Name"
                  fullWidth
                  error={!!editErrors.firstName}
                  helperText={editErrors.firstName?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...registerEdit('lastName')}
                  label="Last Name"
                  fullWidth
                  error={!!editErrors.lastName}
                  helperText={editErrors.lastName?.message}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  {...registerEdit('username')}
                  label="Username"
                  fullWidth
                  error={!!editErrors.username}
                  helperText={editErrors.username?.message}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...registerEdit('employeeId')}
                  label="Employee ID"
                  fullWidth
                  error={!!editErrors.employeeId}
                  helperText={editErrors.employeeId?.message}
                />
              </Grid>
            </Grid>
            <TextField
              {...registerEdit('email')}
              label="Email (optional)"
              fullWidth
              error={!!editErrors.email}
              helperText={editErrors.email?.message}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  {...registerEdit('cabinet')}
                  label="Cabinet / Room (optional)"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  {...registerEdit('extensionNumber')}
                  label="Extension Number"
                  fullWidth
                  placeholder="Empty releases extension"
                  error={!!editErrors.extensionNumber}
                  helperText={editErrors.extensionNumber?.message}
                />
              </Grid>
            </Grid>
            <Controller
              name="role"
              control={editControl}
              render={({ field }) => (
                <TextField {...field} label="Role" select fullWidth>
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="departmentId"
              control={editControl}
              render={({ field }) => (
                <TextField {...field} label="Department (optional)" select fullWidth>
                  <MenuItem value="">None</MenuItem>
                  {departments?.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditUser(null);
              resetEdit();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-user-form"
            variant="contained"
            disabled={isEditSubmitting || updateMutation.isPending}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!passwordUser}
        onClose={() => {
          setPasswordUser(null);
          resetPasswordForm();
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Set a new login password for {passwordUser?.firstName} {passwordUser?.lastName}.
          </DialogContentText>
          <Box
            component="form"
            id="reset-password-form"
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          >
            <TextField
              {...registerPassword('newPassword')}
              label="New Password"
              type="password"
              fullWidth
              error={!!passwordErrors.newPassword}
              helperText={passwordErrors.newPassword?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPasswordUser(null);
              resetPasswordForm();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="reset-password-form"
            variant="contained"
            disabled={isPasswordSubmitting || resetPasswordMutation.isPending}
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deleteUser} onClose={() => setDeleteUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete {deleteUser?.firstName} {deleteUser?.lastName}? Their extension and SIP account
            will be released.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUser(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrUser} onClose={() => setQrUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Activation QR Code</DialogTitle>
        <DialogContent>
          {qrUser && (
            <Stack alignItems="center" spacing={2} py={1}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Let <strong>{qrUser.user.firstName}</strong> scan this with the Esta Connect app
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <QRCodeSVG value={qrUser.code} size={200} level="M" />
              </Box>
              <Typography
                variant="body1"
                sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 2, py: 0.75, borderRadius: 1, letterSpacing: 1 }}
              >
                {qrUser.code}
              </Typography>
              <Alert severity="info" sx={{ width: '100%' }}>
                Code is single-use and will expire after activation.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrUser(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
