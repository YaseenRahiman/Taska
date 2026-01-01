'use client';

import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import type { RiskScore, RiskLevel } from '@/types/payment-approval.types';

interface RiskScoreVisualizationProps {
  riskScore: RiskScore;
  compact?: boolean;
}

export default function RiskScoreVisualization({
  riskScore,
  compact = false
}: RiskScoreVisualizationProps) {
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'LOW':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          bar: 'bg-green-500',
          icon: CheckCircle,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          bar: 'bg-yellow-500',
          icon: AlertCircle,
        };
      case 'HIGH':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          bar: 'bg-red-500',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          bar: 'bg-gray-500',
          icon: AlertCircle,
        };
    }
  };

  const colors = getRiskColor(riskScore.level);
  const Icon = colors.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} transition-all duration-300`}
            style={{ width: `${riskScore.overall}%` }}
            role="progressbar"
            aria-valuenow={riskScore.overall}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <span className={`text-sm font-medium ${colors.text}`}>
          {riskScore.overall}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Risk Score */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${colors.text}`} aria-hidden="true" />
            <span className="font-medium text-gray-900">Risk Score</span>
          </div>
          <span className={`text-2xl font-bold ${colors.text}`}>
            {riskScore.overall}
          </span>
        </div>

        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} transition-all duration-300`}
            style={{ width: `${riskScore.overall}%` }}
            role="progressbar"
            aria-valuenow={riskScore.overall}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Risk score: ${riskScore.overall} out of 100`}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Low Risk</span>
          <span>High Risk</span>
        </div>
      </div>

      {/* Risk Level Badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Risk Level:</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
          {riskScore.level}
        </span>
      </div>

      {/* Recommendation */}
      {riskScore.recommendation && (
        <div className={`p-3 rounded-lg ${colors.bg}`}>
          <p className={`text-sm ${colors.text}`}>
            <strong>Recommendation:</strong> {riskScore.recommendation}
          </p>
        </div>
      )}

      {/* Risk Factors */}
      {riskScore.factors && riskScore.factors.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Risk Factors:</h4>
          <ul className="space-y-2">
            {riskScore.factors.map((factor, index) => {
              const factorColors = getRiskColor(factor.severity);
              return (
                <li
                  key={index}
                  className={`p-2 rounded-lg ${factorColors.bg} border-l-4 ${factorColors.bar.replace('bg-', 'border-')}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${factorColors.text}`}>
                        {factor.factor}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {factor.description}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${factorColors.text} shrink-0`}>
                      {factor.score}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
