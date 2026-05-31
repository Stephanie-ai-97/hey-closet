/**
 * AI Review Modal
 * 
 * Displays AI analysis results with edit capability
 * Allows users to review and modify AI-generated metadata before saving
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Edit2, RefreshCw, X, ZapOff } from 'lucide-react';
import type { AiClothingMetadata } from '../lib/aiValidation';
import {
  clothingCategories,
  clothingSubcategories,
  colours,
  materials,
  seasons,
  styles,
  occasions,
  fits,
  warmthLevels,
} from '../lib/aiValidation';

interface AiReviewModalProps {
  isOpen: boolean;
  metadata: AiClothingMetadata;
  confidenceScore: number;
  previewImageUrl: string;
  onAccept: (metadata: AiClothingMetadata) => void;
  onEdit: (metadata: AiClothingMetadata) => void;
  onCancel: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function AiReviewModal({
  isOpen,
  metadata,
  confidenceScore,
  previewImageUrl,
  onAccept,
  onEdit,
  onCancel,
  onRetry,
  isRetrying = false,
}: AiReviewModalProps) {
  const [editingField, setEditingField] = useState<keyof AiClothingMetadata | null>(null);
  const [editedMetadata, setEditedMetadata] = useState<AiClothingMetadata>(metadata);

  const handleFieldEdit = (field: keyof AiClothingMetadata, value: unknown) => {
    setEditedMetadata((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onEdit(editedMetadata);
    setEditingField(null);
  };

  const resetEdits = () => {
    setEditedMetadata(metadata);
    setEditingField(null);
  };

  const hasChanges = JSON.stringify(editedMetadata) !== JSON.stringify(metadata);

  const confidenceLevel =
    confidenceScore >= 0.85 ? 'high' : confidenceScore >= 0.7 ? 'moderate' : 'low';
  const confidenceColor =
    confidenceLevel === 'high'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : confidenceLevel === 'moderate'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} className="text-emerald-600" />
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">AI Analysis Complete</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Review and adjust the suggested clothing metadata
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Confidence Score */}
          <div className={`rounded-lg p-4 ${confidenceColor} border border-current border-opacity-30`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {confidenceLevel === 'high' && <CheckCircle2 size={20} />}
                {confidenceLevel === 'moderate' && <AlertCircle size={20} />}
                {confidenceLevel === 'low' && <ZapOff size={20} />}
                <div>
                  <div className="font-semibold">
                    {Math.round(confidenceScore * 100)}% Confidence ({confidenceLevel})
                  </div>
                  <p className="text-sm opacity-75 mt-1">
                    {confidenceLevel === 'high'
                      ? 'AI is highly confident in this analysis'
                      : confidenceLevel === 'moderate'
                        ? 'Please review the suggestions carefully'
                        : 'Consider entering details manually'}
                  </p>
                </div>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="px-3 py-1 rounded border border-current border-opacity-50 hover:bg-current hover:bg-opacity-10 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw size={14} className="inline mr-1.5 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} className="inline mr-1.5" />
                      Retry
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Warnings */}
          {editedMetadata.warnings && editedMetadata.warnings.length > 0 && (
            <div className="space-y-2">
              {editedMetadata.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 text-sm"
                >
                  <AlertCircle size={16} className="inline mr-2" />
                  {warning}
                </div>
              ))}
            </div>
          )}

          {/* Image Preview + Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Image */}
            <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
              <img
                src={previewImageUrl}
                alt="Scanned clothing"
                className="w-full h-48 object-cover"
              />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">Category</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-1">
                  {editedMetadata.category}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">Type</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-1">
                  {editedMetadata.subcategory}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">Style</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-1">
                  {editedMetadata.style}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">Fit</div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mt-1">
                  {editedMetadata.fit}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">Metadata</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primary Colour */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Primary Color
                </label>
                <select
                  value={editedMetadata.primaryColor}
                  onChange={(e) => handleFieldEdit('primaryColor', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm"
                >
                  {colours.map((colour) => (
                    <option key={colour} value={colour}>
                      {colour.charAt(0).toUpperCase() + colour.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary Colour */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Secondary Color (optional)
                </label>
                <select
                  value={editedMetadata.secondaryColor || ''}
                  onChange={(e) => handleFieldEdit('secondaryColor', e.target.value || null)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm"
                >
                  <option value="">None</option>
                  {colours.map((colour) => (
                    <option key={colour} value={colour}>
                      {colour.charAt(0).toUpperCase() + colour.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Material
                </label>
                <select
                  value={editedMetadata.material}
                  onChange={(e) => handleFieldEdit('material', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm"
                >
                  {materials.map((material) => (
                    <option key={material} value={material}>
                      {material.charAt(0).toUpperCase() + material.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Season
                </label>
                <select
                  value={editedMetadata.season}
                  onChange={(e) => handleFieldEdit('season', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm"
                >
                  {seasons.map((season) => (
                    <option key={season} value={season}>
                      {season.charAt(0).toUpperCase() + season.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occasion */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Occasion
                </label>
                <select
                  value={editedMetadata.occasion}
                  onChange={(e) => handleFieldEdit('occasion', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm"
                >
                  {occasions.map((occasion) => (
                    <option key={occasion} value={occasion}>
                      {occasion.charAt(0).toUpperCase() + occasion.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Warmth Level */}
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  Warmth Level
                </label>
                <select
                  value={editedMetadata.warmthLevel}
                  onChange={(e) => handleFieldEdit('warmthLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm"
                >
                  {warmthLevels.map((level) => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Notes
              </label>
              <textarea
                value={editedMetadata.notes}
                onChange={(e) => handleFieldEdit('notes', e.target.value)}
                maxLength={240}
                rows={3}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm resize-none"
                placeholder="Any additional notes about this item..."
              />
              <div className="text-xs text-zinc-500 mt-1">
                {editedMetadata.notes.length}/240 characters
              </div>
            </div>

            {/* AI Generated Tags */}
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Generated Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {editedMetadata.generatedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800 sticky bottom-0 bg-white dark:bg-zinc-900">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors font-semibold"
            >
              Discard
            </button>

            {hasChanges && (
              <button
                onClick={resetEdits}
                className="px-4 py-2.5 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors font-semibold"
              >
                <RefreshCw size={16} className="inline mr-1.5" />
                Reset
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {hasChanges ? (
                <>
                  <Edit2 size={16} />
                  Update
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
