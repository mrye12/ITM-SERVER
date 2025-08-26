'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToastSuccess, useToastError } from '@/components/ui/Toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  ArrowRight,
  Eye,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface ApprovalStep {
  step_number: number;
  approver_id: string;
  approver_name: string;
  approver_position: string;
  status: 'pending' | 'approved' | 'rejected' | 'delegated';
  comments?: string;
  action_date?: string;
  delegated_to?: string;
  delegated_to_name?: string;
}

interface WorkflowInstance {
  id: string;
  entity_type: string;
  entity_id: string;
  entity_data: any;
  workflow_name: string;
  current_step: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  initiated_by: string;
  initiated_by_name: string;
  initiated_at: string;
  steps: ApprovalStep[];
}

interface ApprovalWorkflowProps {
  workflowInstance: WorkflowInstance;
  currentUserId: string;
  onStatusChange?: (newStatus: string) => void;
  showEntityDetails?: boolean;
}

export default function ApprovalWorkflow({
  workflowInstance,
  currentUserId,
  onStatusChange,
  showEntityDetails = true
}: ApprovalWorkflowProps) {
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delegate'>('approve');
  const [comments, setComments] = useState('');
  const [delegateToId, setDelegateToId] = useState('');
  const [loading, setLoading] = useState(false);

  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  const currentStep = workflowInstance.steps.find(
    step => step.step_number === workflowInstance.current_step
  );

  const canTakeAction = currentStep?.approver_id === currentUserId && 
                       currentStep?.status === 'pending' &&
                       workflowInstance.status === 'pending';

  const handleAction = async (action: 'approve' | 'reject' | 'delegate') => {
    setActionType(action);
    setIsActionModalOpen(true);
  };

  const submitAction = async () => {
    if (!comments.trim() && actionType !== 'approve') {
      toastError('Comments are required for rejection or delegation');
      return;
    }

    if (actionType === 'delegate' && !delegateToId) {
      toastError('Please select someone to delegate to');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/workflow/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_instance_id: workflowInstance.id,
          action: actionType,
          comments: comments.trim(),
          delegate_to_id: actionType === 'delegate' ? delegateToId : undefined
        })
      });

      if (!response.ok) throw new Error('Failed to process action');

      const result = await response.json();
      
      toastSuccess(`Workflow ${actionType}d successfully`);
      setIsActionModalOpen(false);
      setComments('');
      setDelegateToId('');
      
      if (onStatusChange) {
        onStatusChange(result.new_status);
      }

      // Refresh the page or update the component state
      window.location.reload();

    } catch (error) {
      toastError('Failed to process workflow action');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step: ApprovalStep) => {
    switch (step.status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <User className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepStatus = (step: ApprovalStep, index: number) => {
    if (step.status !== 'pending') return step.status;
    if (index + 1 < workflowInstance.current_step) return 'completed';
    if (index + 1 === workflowInstance.current_step) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {workflowInstance.workflow_name}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Initiated by: {workflowInstance.initiated_by_name}</span>
                <span>•</span>
                <span>{new Date(workflowInstance.initiated_at).toLocaleDateString()}</span>
                <span>•</span>
                <StatusBadge status={workflowInstance.status} />
              </div>
            </div>
            
            {workflowInstance.status === 'pending' && (
              <div className="text-sm text-gray-600">
                Step {workflowInstance.current_step} of {workflowInstance.steps.length}
              </div>
            )}
          </div>
        </CardHeader>

        {showEntityDetails && (
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Request Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium">{workflowInstance.entity_type}</span>
                </div>
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-2 font-medium">{workflowInstance.entity_id}</span>
                </div>
                {/* Add more entity-specific details based on entity_data */}
                {workflowInstance.entity_data && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Details:</span>
                    <pre className="ml-2 text-xs bg-white p-2 rounded border mt-1 overflow-auto">
                      {JSON.stringify(workflowInstance.entity_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflowInstance.steps.map((step, index) => {
              const stepStatus = getStepStatus(step, index);
              const isCurrent = stepStatus === 'current';
              const isCompleted = stepStatus === 'completed' || step.status === 'approved';
              const isPending = step.status === 'pending' && isCurrent;

              return (
                <div
                  key={step.step_number}
                  className={`flex items-start space-x-4 p-4 rounded-lg border ${
                    isCurrent ? 'border-blue-200 bg-blue-50' : 
                    isCompleted ? 'border-green-200 bg-green-50' : 
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getStepIcon(step)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Step {step.step_number}: {step.approver_name}
                        </p>
                        <p className="text-xs text-gray-600">{step.approver_position}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={step.status} size="sm" />
                        {step.action_date && (
                          <span className="text-xs text-gray-500">
                            {new Date(step.action_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {step.comments && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{step.comments}</p>
                        </div>
                      </div>
                    )}

                    {step.delegated_to && (
                      <div className="mt-2 text-sm text-orange-600">
                        <ArrowRight className="h-4 w-4 inline mr-1" />
                        Delegated to: {step.delegated_to_name}
                      </div>
                    )}

                    {isPending && canTakeAction && (
                      <div className="mt-3 flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction('approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction('reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction('delegate')}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Delegate
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Request`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              You are about to <strong>{actionType}</strong> this workflow request.
            </p>
          </div>

          {actionType === 'delegate' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delegate to:
              </label>
              <select
                value={delegateToId}
                onChange={(e) => setDelegateToId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a person...</option>
                {/* This would be populated from an API call */}
                <option value="user1">John Doe (Manager)</option>
                <option value="user2">Jane Smith (Director)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments {actionType !== 'approve' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder={`Add your comments for ${actionType}...`}
              required={actionType !== 'approve'}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsActionModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAction}
              loading={loading}
              className={
                actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-orange-600 hover:bg-orange-700'
              }
            >
              {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

