import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Filter, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { Subject } from '../../types';
import { LoadingCard } from '../../components/ui/LoadingCard';
import { useSubjects, useSubjectMutations } from '../../hooks/useApi';
import { Textarea } from '../../components/ui/Textarea';
import { parseApiValidationError } from '../../utils/apiError';

const SubjectCard = React.memo(function SubjectCard({
  subject,
  onEdit,
  onDelete,
}: {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}) {
  return (
    <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate" title={subject.name}>
          {subject.name}
        </h3>
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(subject)}
            className="p-2 rounded-lg text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            aria-label="Edit subject"
            type="button"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(subject)}
            className="p-2 rounded-lg text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
            aria-label="Delete subject"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{subject.description}</p>
      <div className="mt-auto">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Created {new Date(subject.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
});

const SubjectsPage: React.FC = () => {
  const { data: subjects, isLoading } = useSubjects();
  const { createSubject, updateSubject, deleteSubject } = useSubjectMutations();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [newSubject, setNewSubject] = useState<Omit<Subject, 'id' | 'created_at'>>({ 
    name: '', 
    description: '',
  });
  const [validationErrors, setValidationErrors] = useState<{ 
    name?: string; 
    description?: string;
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

  const filteredSubjects = useMemo(
    () =>
      subjects?.data
        ?.filter((subject: Subject) =>
          subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subject.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a: Subject, b: Subject) =>
          sortOrder === 'asc' 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name)
        ) ?? [],
    [subjects, searchTerm, sortOrder]
  );

  const pageCount = Math.ceil(filteredSubjects.length / itemsPerPage);
  const paginatedSubjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(start, start + itemsPerPage);
  }, [filteredSubjects, currentPage, itemsPerPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, sortOrder]);

  const validateForm = useCallback(() => {
    const errors: typeof validationErrors = {};
    
    if (!newSubject.name?.trim()) {
      errors.name = 'Name is required';
    } else {
      const normalizedName = newSubject.name.trim().toLowerCase();
      const isDuplicate = subjects?.data.some(
        s => s.name.trim().toLowerCase() === normalizedName &&
        (!currentSubject || s.id !== currentSubject.id)
      );
      if (isDuplicate) errors.name = 'Subject name already exists';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newSubject, subjects, currentSubject]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setCurrentSubject(null);
    setNewSubject({ name: '', description: '' });
    setValidationErrors({});
  }, []);

  const handleDeleteModalClose = useCallback(() => {
    setIsDeleteModalOpen(false);
    setCurrentSubject(null);
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

  const handleAddSubject = useCallback(() => {
    setCurrentSubject(null);
    setNewSubject({ name: '', description: '' });
    setIsModalOpen(true);
  }, []);

  const handleEditSubject = useCallback((subject: Subject) => {
    setCurrentSubject(subject);
    setNewSubject(subject);
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((subject: Subject) => {
    setCurrentSubject(subject);
    setIsDeleteModalOpen(true);
  }, []);

  const handleSaveSubject = useCallback(async () => {
    if (!validateForm()) return;

    const data = {
      ...newSubject,
      name: newSubject.name.trim(),
      description: newSubject.description.trim()
    };
    
    setIsSaving(true);
    try {
      if (currentSubject) {
        await updateSubject.mutateAsync({
          id: currentSubject.id,
          data
        });
        toast.success('Subject updated successfully');
      } else {
        await createSubject.mutateAsync(data as Subject);
        toast.success('Subject created successfully');
      }
      handleModalClose();
    } catch (error) {
      const errors = parseApiValidationError(error);
      setValidationErrors(errors);
      toast.error(Object.values(errors)[0] || 
        (currentSubject ? 'Failed to update subject' : 'Failed to create subject'));
    } finally {
      setIsSaving(false);
    }
  }, [newSubject, currentSubject, validateForm, updateSubject, createSubject, handleModalClose]);

  const handleDeleteSubject = useCallback(async () => {
    if (!currentSubject) return;
    setIsDeleting(true);
    try {
      await deleteSubject.mutateAsync(currentSubject.id);
      toast.success('Subject deleted successfully');
      handleDeleteModalClose();
    } catch (error) {
      toast.error('Failed to delete subject');
    } finally {
      setIsDeleting(false);
    }
  }, [currentSubject, deleteSubject, handleDeleteModalClose]);

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subjects</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your subjects</p>
          </div>
          <Button
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={handleAddSubject}
            className="mt-4 md:mt-0 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
          >
            Add Subject
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search subjects..."
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

        {paginatedSubjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedSubjects.map((subject: Subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onEdit={handleEditSubject}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No subjects found. Try changing your search or create a new subject.
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
                  {currentSubject ? 'Edit Subject' : 'New Subject'}
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
                  label="Subject Name *"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  placeholder="Enter subject name"
                  error={validationErrors.name}
                  required
                />

                <Textarea
                  label="Description *"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  placeholder="Enter subject description"
                  error={validationErrors.description}
                  required
                  className="min-h-[100px]"
                />
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
                  onClick={handleSaveSubject}
                  className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                  disabled={isSaving}
                  type="button"
                >
                  {isSaving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  {currentSubject ? 'Save Changes' : 'Create Subject'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {isDeleteModalOpen && currentSubject && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onMouseDown={(e) => e.target === modalBackdropRef.current && handleDeleteModalClose()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete Subject
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
                  Are you sure you want to delete <span className="font-semibold">{currentSubject.name}</span>?
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
                    onClick={handleDeleteSubject}
                    className="bg-gradient-to-r from-error-600 to-error-500 hover:from-error-700 hover:to-error-600"
                    disabled={isDeleting}
                    type="button"
                  >
                    {isDeleting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    Delete Subject
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

export default SubjectsPage;