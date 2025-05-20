import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Filter, Loader2, Palette } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { Group } from '../../types';
import { LoadingCard } from '../../components/ui/LoadingCard';
import { useGroups, useGroupMutations } from '../../hooks/useApi';
import { Textarea } from '../../components/ui/Textarea';
import { parseApiValidationError } from '../../utils/apiError';

const GroupCard = React.memo(function GroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: Group;
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
}) {
  return (
    <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="h-4 w-4 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-lg flex-shrink-0"
            style={{ backgroundColor: group.color }}
          />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate" title={group.name}>
            {group.name}
          </h3>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(group)}
            className="p-2 rounded-lg text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            aria-label="Edit group"
            type="button"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(group)}
            className="p-2 rounded-lg text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
            aria-label="Delete group"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{group.description}</p>
      <div className="mt-auto">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Created {new Date(group.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
});

const GroupsPage: React.FC = () => {
  const { data: groups, isLoading } = useGroups();
  const { createGroup, updateGroup, deleteGroup } = useGroupMutations();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [newGroup, setNewGroup] = useState<Omit<Group, 'id' | 'created_at'>>({ 
    name: '', 
    description: '', 
    color: '#6366F1' 
  });
  const [validationErrors, setValidationErrors] = useState<{ 
    name?: string; 
    description?: string;
    color?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const modalBackdropRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      setValidationErrors({});
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [isModalOpen]);

  const filteredGroups = useMemo(
    () =>
      groups?.data
        ?.filter((group: Group) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a: Group, b: Group) =>
          sortOrder === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name)
        ) ?? [],
    [groups, searchTerm, sortOrder]
  );

  const pageCount = Math.ceil(filteredGroups.length / itemsPerPage);
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGroups.slice(start, start + itemsPerPage);
  }, [filteredGroups, currentPage, itemsPerPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, sortOrder]);

  const validateForm = useCallback(() => {
    const errors: typeof validationErrors = {};
    const color = newGroup.color?.trim();
    
    if (!newGroup.name?.trim()) {
      errors.name = 'Name is required';
    } else {
      const normalizedName = newGroup.name.trim().toLowerCase();
      const isDuplicate = groups?.data.some(
        g => g.name.trim().toLowerCase() === normalizedName &&
        (!currentGroup || g.id !== currentGroup.id)
      );
      if (isDuplicate) errors.name = 'Group name already exists';
    }
    
    if (!newGroup.description?.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!color) {
      errors.color = 'Color is required';
    } else if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      errors.color = 'Invalid color format';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newGroup, groups, currentGroup]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setCurrentGroup(null);
    setNewGroup({ name: '', description: '', color: '#6366F1' });
    setValidationErrors({});
  }, []);

  const handleDeleteModalClose = useCallback(() => {
    setIsDeleteModalOpen(false);
    setCurrentGroup(null);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isModalOpen) handleModalClose();
        if (isDeleteModalOpen) handleDeleteModalClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, isDeleteModalOpen, handleModalClose, handleDeleteModalClose]);

  const handleAddGroup = useCallback(() => {
    setCurrentGroup(null);
    setNewGroup({ name: '', description: '', color: '#6366F1' });
    setIsModalOpen(true);
  }, []);

  const handleEditGroup = useCallback((group: Group) => {
    setCurrentGroup(group);
    setNewGroup({ 
      ...group,
      color: group.color || '#6366F1'
    });
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((group: Group) => {
    setCurrentGroup(group);
    setIsDeleteModalOpen(true);
  }, []);

  const handleSaveGroup = useCallback(async () => {
    if (!validateForm()) return;

    const data = {
      ...newGroup,
      color: newGroup.color!.trim()
    };
    setIsSaving(true);
    try {
      if (currentGroup) {
        await updateGroup.mutateAsync({
          id: currentGroup.id,
          data
        });
        toast.success('Group updated successfully');
      } else {
        await createGroup.mutateAsync(data as Group);
        toast.success('Group created successfully');
      }
      handleModalClose();
    } catch (error) {
      const errors = parseApiValidationError(error);
      setValidationErrors(errors);
      toast.error(Object.values(errors)[0] || 
        (currentGroup ? 'Failed to update group' : 'Failed to create group'));
    } finally {
      setIsSaving(false);
    }
  }, [newGroup, currentGroup, validateForm, updateGroup, createGroup, handleModalClose]);

  const handleDeleteGroup = useCallback(async () => {
    if (!currentGroup) return;
    setIsDeleting(true);
    try {
      await deleteGroup.mutateAsync(currentGroup.id);
      toast.success('Group deleted successfully');
      handleDeleteModalClose();
    } catch (error) {
      toast.error('Failed to delete group');
    } finally {
      setIsDeleting(false);
    }
  }, [currentGroup, deleteGroup, handleDeleteModalClose]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <LoadingCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your groups</p>
          </div>
          <Button
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={handleAddGroup}
            className="mt-4 md:mt-0 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
          >
            Add Group
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
              rightIcon={
                searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                ) : undefined
              }
              className="pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="relative">
            <Select
              options={[
                { value: 'asc', label: 'Name (A-Z)' },
                { value: 'desc', label: 'Name (Z-A)' },
              ]}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="min-w-[180px] bg-white dark:bg-gray-800 pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
              <Filter className="h-5 w-5" />
            </div>
          </div>
        </div>

        {paginatedGroups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedGroups.map((group: Group) => (
              <GroupCard
                key={group.id}
                group={group}
                onEdit={handleEditGroup}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No groups found. Try changing your search or create a new group.
            </p>
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex justify-center mt-8 space-x-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Prev
            </Button>
            {[...Array(pageCount)].map((_, idx) => (
              <Button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                variant={currentPage === idx + 1 ? "primary" : "outline"}
                className={currentPage === idx + 1 ? "font-bold" : ""}
              >
                {idx + 1}
              </Button>
            ))}
            <Button
              onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}

        {isModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            ref={modalBackdropRef}
            onMouseDown={(e) => e.target === modalBackdropRef.current && handleModalClose()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {currentGroup ? 'Edit Group' : 'New Group'}
                </h3>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close dialog"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <Input
                  ref={nameInputRef}
                  label="Group Name *"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Enter group name"
                  error={validationErrors.name}
                  required
                />

                <Textarea
                  label="Description *"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Enter group description"
                  error={validationErrors.description}
                  required
                  className="min-h-[100px]"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color *
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={newGroup.color}
                        onChange={(e) => setNewGroup({ 
                          ...newGroup, 
                          color: e.target.value || '#6366F1' 
                        })}
                        className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
                        aria-label="Choose color"
                      />
                      <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm">
                        <Palette className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={newGroup.color}
                        onChange={(e) => setNewGroup({ 
                          ...newGroup, 
                          color: e.target.value || '#6366F1' 
                        })}
                        placeholder="Hex color code"
                        error={validationErrors.color}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-2 rounded-b-lg">
                <Button
                  variant="outline"
                  onClick={handleModalClose}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveGroup}
                  className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                  disabled={isSaving}
                  type="button"
                >
                  {isSaving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  {currentGroup ? 'Save Changes' : 'Create Group'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {isDeleteModalOpen && currentGroup && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onMouseDown={(e) => e.target === modalBackdropRef.current && handleDeleteModalClose()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete Group
                </h3>
                <button
                  onClick={handleDeleteModalClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close dialog"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  Are you sure you want to delete <span className="font-semibold">{currentGroup.name}</span>?
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleDeleteModalClose}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteGroup}
                    className="bg-gradient-to-r from-error-600 to-error-500 hover:from-error-700 hover:to-error-600"
                    disabled={isDeleting}
                    type="button"
                  >
                    {isDeleting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    Delete Group
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;