import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Filter, Loader2, Users, Book, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import toast from 'react-hot-toast';
import { useGroups, useSubjects, usePlans, usePlanMutations } from '../../hooks/useApi';
import { LoadingCard } from '../../components/ui/LoadingCard';
import { Plan, Group, Subject } from '../../types';
import { parseApiValidationError } from '../../utils/apiError';

const getTotalHours = (plan: Plan): number =>
  plan.lecture_hours + plan.practice_hours + plan.lab_hours + plan.other_hours;

const PlanCard = React.memo(function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
}) {
  return (
    <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
            {plan.name}
          </h3>
        </div>
        <div className="flex space-x-1 ml-auto">
          <button
            onClick={() => onEdit(plan)}
            className="p-2 rounded-lg text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            aria-label="Edit plan"
            type="button"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(plan)}
            className="p-2 rounded-lg text-gray-500 hover:text-error-600 dark:text-gray-400 dark:hover:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
            aria-label="Delete plan"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {plan.group_name} - {plan.subject_name}
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Book className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Lectures</span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.lecture_hours}h</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Practice</span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.practice_hours}h</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Lab</span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.lab_hours}h</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Other</span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.other_hours}h</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Hours</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{getTotalHours(plan)}h</span>
        </div>
      </div>
    </div>
  );
});

const PlanPage: React.FC = () => {
  const { data: plans, isLoading: isLoadingPlans } = usePlans();
  const { data: groups, isLoading: isLoadingGroups } = useGroups();
  const { data: subjects, isLoading: isLoadingSubjects } = useSubjects();
  const { createPlan, updatePlan, deletePlan } = usePlanMutations();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [planForm, setPlanForm] = useState<Partial<Plan>>({
    name: '',
    group: '',
    subject: '',
    lecture_hours: 0,
    practice_hours: 0,
    lab_hours: 0,
    other_hours: 0,
  });
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    group?: string;
    subject?: string;
    lecture_hours?: string;
    practice_hours?: string;
    lab_hours?: string;
    other_hours?: string;
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

  const filteredPlans = useMemo(
    () =>
      (plans?.data || [])
        .filter((plan) =>
          plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.subject_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
          const totalA = getTotalHours(a);
          const totalB = getTotalHours(b);
          return sortOrder === 'asc' ? totalA - totalB : totalB - totalA;
        }),
    [plans, searchTerm, sortOrder]
  );

  const pageCount = Math.ceil(filteredPlans.length / itemsPerPage);
  const paginatedPlans = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPlans.slice(start, start + itemsPerPage);
  }, [filteredPlans, currentPage, itemsPerPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, sortOrder]);

  const validateForm = useCallback(() => {
    const errors: typeof validationErrors = {};
    const totalHours = 
      (planForm.lecture_hours || 0) +
      (planForm.practice_hours || 0) +
      (planForm.lab_hours || 0) +
      (planForm.other_hours || 0);

    if (!planForm.name?.trim()) {
      errors.name = 'Plan name is required';
    }
    if (!planForm.group) {
      errors.group = 'Group is required';
    }
    if (!planForm.subject) {
      errors.subject = 'Subject is required';
    }
    if (planForm.lecture_hours === undefined || planForm.lecture_hours < 0) {
      errors.lecture_hours = 'Invalid lecture hours';
    }
    if (planForm.practice_hours === undefined || planForm.practice_hours < 0) {
      errors.practice_hours = 'Invalid practice hours';
    }
    if (planForm.lab_hours === undefined || planForm.lab_hours < 0) {
      errors.lab_hours = 'Invalid lab hours';
    }
    if (planForm.other_hours === undefined || planForm.other_hours < 0) {
      errors.other_hours = 'Invalid other hours';
    }
    if (totalHours < 1) {
      errors.lecture_hours = 'Total hours must be at least 1';
      errors.practice_hours = 'Total hours must be at least 1';
      errors.lab_hours = 'Total hours must be at least 1';
      errors.other_hours = 'Total hours must be at least 1';
    }

    console.log(plans?.data)

    const hasExisting = plans?.data?.some(p => 

      p.group === planForm.group && 
      p.subject === planForm.subject &&

      (!currentPlan || p.id !== currentPlan.id)
    ) ?? false;
    
    if (hasExisting) {
      errors.group = 'Plan for this group and subject already exists';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [planForm, plans, currentPlan]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setCurrentPlan(null);
    setPlanForm({
      name: '',
      group: '',
      subject: '',
      lecture_hours: 0,
      practice_hours: 0,
      lab_hours: 0,
      other_hours: 0,
    });
    setValidationErrors({});
  }, []);

  const handleDeleteModalClose = useCallback(() => {
    setIsDeleteModalOpen(false);
    setCurrentPlan(null);
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

  const handleAddPlan = useCallback(() => {
    setCurrentPlan(null);
    setPlanForm({
      name: '',
      group: groups?.data[0]?.id || '',
      subject: subjects?.data[0]?.id || '',
      lecture_hours: 0,
      practice_hours: 0,
      lab_hours: 0,
      other_hours: 0,
    });
    setIsModalOpen(true);
  }, [groups, subjects]);

  const handleEditPlan = useCallback((plan: Plan) => {
    setCurrentPlan(plan);
    setPlanForm({ 
      name: plan.name,
      group: plan.group,
      subject: plan.subject,
      lecture_hours: plan.lecture_hours,
      practice_hours: plan.practice_hours,
      lab_hours: plan.lab_hours,
      other_hours: plan.other_hours
    });
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((plan: Plan) => {
    setCurrentPlan(plan);
    setIsDeleteModalOpen(true);
  }, []);

  const handleSavePlan = useCallback(async () => {
    if (!validateForm()) return;

    const data = {
      name: planForm.name!,
      group: planForm.group!,
      subject: planForm.subject!,
      lecture_hours: planForm.lecture_hours!,
      practice_hours: planForm.practice_hours!,
      lab_hours: planForm.lab_hours!,
      other_hours: planForm.other_hours!,
    };

    setIsSaving(true);
    try {
      if (currentPlan) {
        await updatePlan.mutateAsync({ id: currentPlan.id, data });
        toast.success('Plan updated successfully');
      } else {
        await createPlan.mutateAsync(data);
        toast.success('Plan created successfully');
      }
      handleModalClose();
    } catch (error) {
      const errors = parseApiValidationError(error);
      setValidationErrors(errors);
      toast.error(Object.values(errors)[0] || 
        (currentPlan ? 'Failed to update plan' : 'Failed to create plan'));
    } finally {
      setIsSaving(false);
    }
  }, [planForm, currentPlan, validateForm, updatePlan, createPlan, handleModalClose]);

  const handleDeletePlan = useCallback(async () => {
    if (!currentPlan) return;
    setIsDeleting(true);
    try {
      await deletePlan.mutateAsync(currentPlan.id);
      toast.success('Plan deleted successfully');
      handleDeleteModalClose();
    } catch (error) {
      toast.error('Failed to delete plan');
    } finally {
      setIsDeleting(false);
    }
  }, [currentPlan, deletePlan, handleDeleteModalClose]);

  if (isLoadingPlans || isLoadingGroups || isLoadingSubjects) {
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plans</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage group-subject plans</p>
          </div>
          <Button
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={handleAddPlan}
            className="mt-4 md:mt-0 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
          >
            Add Plan
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search plans..."
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
                { value: 'desc', label: 'Most Hours' },
                { value: 'asc', label: 'Least Hours' },
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

        {paginatedPlans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedPlans.map((plan: Plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={handleEditPlan}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No plans found. Try changing your search or create a new plan.
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
                  {currentPlan ? 'Edit Plan' : 'New Plan'}
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
                  label="Plan Name *"
                  value={planForm.name}
                  onChange={(e) => setPlanForm(p => ({ ...p, name: e.target.value }))}
                  error={validationErrors.name}
                  required
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Group *
                  </label>
                  <select
                    value={planForm.group}
                    onChange={e => setPlanForm(p => ({ ...p, group_id: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2"
                    required
                  >
                    <option value="">Select Group</option>
                    {groups?.data?.map((group: Group) => (
                      <option 
                        key={group.id} 
                        value={group.id}
                        selected={group.id === planForm.group}
                      >
                        {group.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.group && (
                    <div className="text-error-500 text-sm">{validationErrors.group}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject *
                  </label>
                  <select
                    value={planForm.subject}
                    onChange={e => setPlanForm(p => ({ ...p, subject_id: e.target.value }))}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 p-2"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects?.data?.map((subject: Subject) => (
                      <option 
                        key={subject.id} 
                        value={subject.id}
                        selected={subject.id === planForm.subject}
                      >
                        {subject.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.subject && (
                    <div className="text-error-500 text-sm">{validationErrors.subject}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Lecture Hours"
                    type="number"
                    value={planForm.lecture_hours}
                    onChange={(e) => setPlanForm(p => ({ 
                      ...p, 
                      lecture_hours: Math.max(0, parseInt(e.target.value) || 0) 
                    }))}
                    min={0}
                    error={validationErrors.lecture_hours}
                  />
                  <Input
                    label="Practice Hours"
                    type="number"
                    value={planForm.practice_hours}
                    onChange={(e) => setPlanForm(p => ({ 
                      ...p, 
                      practice_hours: Math.max(0, parseInt(e.target.value) || 0) 
                    }))}
                    min={0}
                    error={validationErrors.practice_hours}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Lab Hours"
                    type="number"
                    value={planForm.lab_hours}
                    onChange={(e) => setPlanForm(p => ({ 
                      ...p, 
                      lab_hours: Math.max(0, parseInt(e.target.value) || 0) 
                    }))}
                    min={0}
                    error={validationErrors.lab_hours}
                  />
                  <Input
                    label="Other Hours"
                    type="number"
                    value={planForm.other_hours}
                    onChange={(e) => setPlanForm(p => ({ 
                      ...p, 
                      other_hours: Math.max(0, parseInt(e.target.value) || 0) 
                    }))}
                    min={0}
                    error={validationErrors.other_hours}
                  />
                </div>

                
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 flex justify-end space-x-2 rounded-b-lg">
                <Button variant="outline" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlan} disabled={isSaving}>
                  {isSaving && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                  {currentPlan ? 'Save Changes' : 'Create Plan'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {isDeleteModalOpen && currentPlan && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onMouseDown={(e) => e.target === modalBackdropRef.current && handleDeleteModalClose()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete Plan
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
                  Are you sure you want to delete the plan{' '}
                  <span className="font-semibold">{currentPlan.name}</span> for{' '}
                  <span className="font-semibold">{currentPlan.group_name}</span> -{' '}
                  <span className="font-semibold">{currentPlan.subject_name}</span>?
                  This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleDeleteModalClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeletePlan}
                    variant="danger"
                    disabled={isDeleting}
                  >
                    {isDeleting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                    Delete Plan
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

export default PlanPage;