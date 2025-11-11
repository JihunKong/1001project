'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartDataPoint {
  month: string;
  draft: number;
  submitted: number;
  published: number;
  total?: number;
}

interface ChartData {
  submissionTrends?: ChartDataPoint[];
  readingAnalytics?: Array<{ month: string; booksCompleted: number; hoursRead: number }>;
  engagement?: Array<{ month: string; comments: number; activities: number }>;
}

interface ProfileChartProps {
  data: ChartData;
  role?: string;
}

export default function ProfileChart({ data, role }: ProfileChartProps) {
  const { t } = useTranslation();
  const chartRef = useRef<ChartJS<"line">>(null);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const submissionData = data.submissionTrends || [];

  const chartData = {
    labels: submissionData.map(d => formatMonth(d.month)),
    datasets: [
      {
        label: t('profile.stats.published'),
        data: submissionData.map(d => d.published),
        borderColor: '#1E3A8A',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      },
      {
        label: t('profile.stats.submitted'),
        data: submissionData.map(d => d.submitted),
        borderColor: '#3730A3',
        backgroundColor: 'rgba(55, 48, 163, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      },
      {
        label: t('profile.stats.draft'),
        data: submissionData.map(d => d.draft),
        borderColor: '#8E8E93',
        backgroundColor: 'rgba(142, 142, 147, 0.1)',
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          font: {
            family: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            size: 14,
            weight: 'normal' as const
          },
          color: '#141414',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          boxWidth: 8,
          boxHeight: 8
        }
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#141414',
        bodyColor: '#141414',
        borderColor: '#E5E5EA',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          family: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          family: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          size: 14,
          weight: 'normal' as const
        },
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        boxPadding: 6
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            size: 14,
            weight: 'normal' as const
          },
          color: '#8E8E93'
        },
        border: {
          color: '#E5E5EA'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#F2F2F7',
          drawTicks: false
        },
        ticks: {
          font: {
            family: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            size: 14,
            weight: 'normal' as const
          },
          color: '#8E8E93',
          padding: 8,
          stepSize: 1
        },
        border: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false
    }
  };

  useEffect(() => {
    const chartInstance = chartRef.current;
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, []);

  if (!submissionData || submissionData.length === 0) {
    return (
      <div className="mb-8">
        <h2 style={{
          fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
          fontSize: '32px',
          fontWeight: 500,
          lineHeight: '1.221',
          color: '#141414',
          marginBottom: '24px'
        }}>
          {t('profile.chart.submissionTrends')}
        </h2>
        <div className="flex items-center justify-center border border-[#E5E5EA] rounded-lg" style={{ height: '350px' }}>
          <p style={{
            fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
            fontSize: '16px',
            color: '#8E8E93'
          }}>
            {t('profile.chart.noData')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 style={{
        fontFamily: '"Helvetica Neue", -apple-system, system-ui, sans-serif',
        fontSize: '32px',
        fontWeight: 500,
        lineHeight: '1.221',
        color: '#141414',
        marginBottom: '24px'
      }}>
        {t('profile.chart.submissionTrends')}
      </h2>
      <div className="bg-white border border-[#E5E5EA] rounded-lg p-6" style={{ height: '350px' }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}
