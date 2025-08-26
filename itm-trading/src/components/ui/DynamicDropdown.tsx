"use client"
import { useState, useEffect } from 'react'
import { Button } from './Button'
import { Input } from './Input'
import { Modal } from './Modal'
import { useToast } from '@/hooks/useToast'

interface Option {
  value: string
  label: string
  category?: string
}

interface DynamicDropdownProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  allowCustom?: boolean
  customLabel?: string
  onAddCustom?: (newValue: string, newLabel: string, category?: string) => Promise<boolean>
  category?: string
  className?: string
  required?: boolean
}

export function DynamicDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  allowCustom = true,
  customLabel = "Add Custom",
  onAddCustom,
  category,
  className = "",
  required = false
}: DynamicDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [customDisplayLabel, setCustomDisplayLabel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    setFilteredOptions(
      options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [options, searchTerm])

  const handleAddCustom = async () => {
    if (!customValue.trim() || !customDisplayLabel.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      if (onAddCustom) {
        const success = await onAddCustom(customValue, customDisplayLabel, category)
        if (success) {
          onChange(customValue)
          setShowCustomModal(false)
          setCustomValue('')
          setCustomDisplayLabel('')
          toast.success('Custom option added successfully!')
        } else {
          toast.error('Failed to add custom option')
        }
      } else {
        // If no custom handler, just add to local state
        onChange(customValue)
        setShowCustomModal(false)
        setCustomValue('')
        setCustomDisplayLabel('')
        toast.success('Custom value selected!')
      }
    } catch (error) {
      console.error('Error adding custom option:', error)
      toast.error('Failed to add custom option')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Main Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 flex items-center justify-between"
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b">
              <Input
                type="text"
                placeholder="Search options..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Options */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between"
                >
                  <span>{option.label}</span>
                  {option.category && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {option.category}
                    </span>
                  )}
                </button>
              ))}
              
              {filteredOptions.length === 0 && searchTerm && (
                <div className="px-4 py-3 text-gray-500 text-center">
                  No options found for &quot;{searchTerm}&quot;
                </div>
              )}
            </div>

            {/* Add Custom Option */}
            {allowCustom && (
              <div className="border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomModal(true)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {customLabel}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Input Modal */}
      <Modal 
        isOpen={showCustomModal} 
        onClose={() => setShowCustomModal(false)}
        title="Add Custom Option"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code/Value <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value.toUpperCase())}
              placeholder="e.g., COAL-C, NI-SPECIAL"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Internal code (will be uppercase)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={customDisplayLabel}
              onChange={(e) => setCustomDisplayLabel(e.target.value)}
              placeholder="e.g., Coal Grade C, Special Nickel Ore"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Name that will be displayed in dropdown</p>
          </div>

          {category && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <Input
                type="text"
                value={category}
                disabled
                className="w-full bg-gray-50"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCustomModal(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCustom}
              disabled={isSubmitting || !customValue.trim() || !customDisplayLabel.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Option'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setIsOpen(false)
            setSearchTerm('')
          }}
        />
      )}
    </div>
  )
}
