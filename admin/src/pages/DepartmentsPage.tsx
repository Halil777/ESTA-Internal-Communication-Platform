import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from 'notistack';
import { departmentsApi } from '../api/departments';
import type { CreateDepartmentDto } from '../api/departments';
import type { Department } from '../types';

const schema = z.object({
  name: z.string().min(2, 'Department name required'),
  code: z.string().min(1, 'Code required').max(20).toUpperCase(),
  floor: z.coerce.number().optional(),
  groupExtension: z.string().regex(/^\d{3,5}$/, 'Must be 3-5 digits').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function DepartmentsPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateDepartmentDto) => departmentsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      enqueueSnackbar('Department created', { variant: 'success' });
      handleClose();
    },
    onError: (e: any) =>
      enqueueSnackbar(e?.response?.data?.message || 'Failed to create', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateDepartmentDto> }) =>
      departmentsApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      enqueueSnackbar('Department updated', { variant: 'success' });
      handleClose();
    },
    onError: () => enqueueSnackbar('Failed to update', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      enqueueSnackbar('Department deleted', { variant: 'info' });
      setDeleteTarget(null);
    },
    onError: (e: any) =>
      enqueueSnackbar(e?.response?.data?.message || 'Failed to delete', { variant: 'error' }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleOpen = (dept?: Department) => {
    if (dept) {
      setEditing(dept);
      reset({
        name: dept.name,
        code: dept.code,
        floor: dept.floor,
        groupExtension: dept.groupExtension,
      });
    } else {
      setEditing(null);
      reset({});
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    reset({});
  };

  const onSubmit = (data: FormData) => {
    const dto: CreateDepartmentDto = {
      name: data.name,
      code: data.code,
      floor: data.floor,
      groupExtension: data.groupExtension || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  const floorLabel = (floor?: number) => {
    if (floor === undefined || floor === null) return null;
    if (floor === 0) return 'Ground Floor';
    return `Floor ${floor}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Departments</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Department
        </Button>
      </Box>

      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : !departments?.length ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Business sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">No departments yet. Create one to get started.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {departments.map((dept) => (
            <Grid item xs={12} sm={6} md={4} key={dept.id}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Business color="primary" />
                    <Typography variant="h6" fontWeight={600} flex={1}>
                      {dept.name}
                    </Typography>
                    <Chip label={dept.code} size="small" variant="outlined" />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {dept.floor !== undefined && dept.floor !== null && (
                      <Chip label={floorLabel(dept.floor)} size="small" color="info" />
                    )}
                    {dept.groupExtension && (
                      <Chip
                        label={`Group: ${dept.groupExtension}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {!dept.isActive && (
                      <Chip label="Inactive" size="small" color="default" />
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => handleOpen(dept)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => setDeleteTarget(dept)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? 'Edit Department' : 'New Department'}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            id="dept-form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              {...register('name')}
              label="Department Name"
              fullWidth
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              {...register('code')}
              label="Code (e.g. IT, HR, MGT)"
              fullWidth
              inputProps={{ style: { textTransform: 'uppercase' } }}
              error={!!errors.code}
              helperText={errors.code?.message}
            />
            <TextField
              {...register('floor')}
              label="Floor (optional)"
              type="number"
              fullWidth
              inputProps={{ min: 0, max: 50 }}
            />
            <TextField
              {...register('groupExtension')}
              label="Group Extension (optional, 3-5 digits)"
              fullWidth
              placeholder="e.g. 200"
              error={!!errors.groupExtension}
              helperText={errors.groupExtension?.message}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            form="dept-form"
            variant="contained"
            disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Department</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Delete <strong>{deleteTarget?.name}</strong>? Users in this department will lose their department assignment.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
