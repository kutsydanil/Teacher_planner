import React, { useState, useMemo } from 'react';
import { Download, Calendar, ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, } from 'recharts';
import { MonthlyStats } from '../../types';
import toast from 'react-hot-toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { LoadingCard } from '../../components/ui/LoadingCard';
import { useMonthlyStats } from '../../hooks/useApi';

const ITEMS_PER_PAGE = 4;
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const StatisticsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showAllItems, setShowAllItems] = useState(false);
  
  const { data: monthlyStatsResponse, isLoading } = useMonthlyStats(selectedMonth + 1, selectedYear);

  const statsData = useMemo(() => {
    if (!monthlyStatsResponse?.data) return null;

    const stats = {
      totalHours: 0,
      lectureHours: 0,
      practiceHours: 0,
      labHours: 0,
      otherHours: 0,
      byGroup: {} as Record<string, number>,
      bySubject: {} as Record<string, number>,
      items: [] as MonthlyStats[]
    };

    monthlyStatsResponse.data.forEach(item => {
      const itemTotal = item.lecture_hours + item.practice_hours + item.lab_hours + item.other_hours;
      
      stats.totalHours += itemTotal;
      stats.lectureHours += item.lecture_hours;
      stats.practiceHours += item.practice_hours;
      stats.labHours += item.lab_hours;
      stats.otherHours += item.other_hours;
      
      stats.byGroup[item.group_name] = (stats.byGroup[item.group_name] || 0) + itemTotal;
      stats.bySubject[item.subject_name] = (stats.bySubject[item.subject_name] || 0) + itemTotal;
      
      stats.items.push({
        ...item,
        lecture_hours: item.lecture_hours,
        practice_hours: item.practice_hours,
        lab_hours: item.lab_hours,
        other_hours: item.other_hours,
      });
    });

    return stats;
  }, [monthlyStatsResponse]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleExportToExcel = async () => {
    if (!statsData) {
      toast.error('No data available to export');
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Teaching Report System';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet('Main Report');
      
      const addHeader = (text: string, mergeCells: string) => {
        try {
          worksheet.mergeCells(mergeCells);
          const cell = worksheet.getCell(mergeCells.split(':')[0]);
          cell.value = text;
          cell.font = { bold: true, size: 14, color: { argb: 'FF2F5496' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } catch (error) {
          console.error('Header creation error:', error);
          worksheet.addRow([text]).font = { bold: true };
        }
      };

      addHeader('Teaching Activity Report', 'A1:G1');
      addHeader(`${monthNames[selectedMonth]} ${selectedYear}`, 'A2:G2');
      worksheet.addRow([]);

      const addDataSection = (
        title: string,
        headers: string[],
        data: Array<[string, number]>
      ) => {
        if (data.length === 0) {
          worksheet.addRow([`${title} - No Data Available`]).font = { italic: true };
          worksheet.addRow([]);
          return;
        }

        const titleRow = worksheet.addRow([title]);
        titleRow.font = { bold: true };
        titleRow.outlineLevel = 1;

        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDDEBF7' }
          };
        });

        data.forEach(([name, hours]) => {
          worksheet.addRow([name, hours]);
        });

        const total = data.reduce((sum, [, hours]) => sum + hours, 0);
        const totalRow = worksheet.addRow(['Total', total]);
        totalRow.eachCell(cell => {
          cell.font = { bold: true };
        });

        worksheet.addRow([]);
      };

      addDataSection(
        'Total Hours Breakdown',
        ['Category', 'Hours'],
        [
          ['Lectures', statsData.lectureHours],
          ['Practice', statsData.practiceHours],
          ['Labs', statsData.labHours],
          ['Other', statsData.otherHours]
        ]
      );

      addDataSection(
        'Hours by Group',
        ['Group', 'Hours'],
        Object.entries(statsData.byGroup)
      );

      addDataSection(
        'Hours by Subject',
        ['Subject', 'Hours'],
        Object.entries(statsData.bySubject)
      );

      const addDetailedSection = () => {
        if (statsData.items.length === 0) {
          worksheet.addRow(['Detailed Entries - No Data Available']).font = { italic: true };
          return;
        }

        const headers = [
          'Group',
          'Subject',
          'Lectures',
          'Practice',
          'Labs',
          'Other',
          'Total'
        ];

        const headerRow = worksheet.addRow(['Detailed Entries']);
        headerRow.font = { bold: true };
        headerRow.outlineLevel = 1;

        const tableHeaders = worksheet.addRow(headers);
        tableHeaders.eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2EFDA' }
          };
        });

        statsData.items.forEach(item => {
          const total = 
            item.lecture_hours +
            item.practice_hours +
            item.lab_hours +
            item.other_hours;

          worksheet.addRow([
            item.group_name || 'N/A',
            item.subject_name || 'N/A',
            item.lecture_hours,
            item.practice_hours,
            item.lab_hours,
            item.other_hours,
            total
          ]);
        });
      };

      addDetailedSection();

      if (worksheet.rowCount <= 5) {
        throw new Error('No valid data found for export');
      }

      worksheet.columns.forEach((column) => {
        if (column.eachCell) {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, cell => {
            try {
              const value = cell.text || '';
              maxLength = Math.max(maxLength, value.length);
            } catch (error) {
              console.error('Error processing cell:', error);
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 10), 30);
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      if (!buffer || buffer.byteLength === 0) {
        throw new Error('Generated file is empty');
      }

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      if (blob.size < 1024) {
        console.warn('Very small file size:', blob.size);
      }

      saveAs(blob, `Teaching_Report_${monthNames[selectedMonth]}_${selectedYear}.xlsx`);
      toast.success('Report generated successfully');

    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Export error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading || !statsData) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingCard message="Loading statistics..." />
        </div>
      </div>
    );
  }

  const displayedItems = showAllItems ? statsData.items : statsData.items.slice(0, ITEMS_PER_PAGE);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
              Teaching Statistics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive overview of teaching activities</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button 
              leftIcon={<Download className="h-5 w-5" />}
              onClick={handleExportToExcel}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white"
            >
              Export Report
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: 'Total Hours', value: statsData.totalHours, color: 'primary' },
            { title: 'Active Groups', value: Object.keys(statsData.byGroup).length, color: 'secondary' },
            { title: 'Subjects Taught', value: Object.keys(statsData.bySubject).length, color: 'accent' },
            { title: 'Weekly Average', value: (statsData.totalHours / 4).toFixed(2), color: 'success' }
          ].map((card, index) => (
            <div 
              key={index}
              className={`group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-${card.color}-500/5 dark:hover:shadow-${card.color}-500/10 hover:border-${card.color}-300 dark:hover:border-${card.color}-600`}
            >
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{card.title}</h3>
              <p className={`text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-${card.color}-600 to-${card.color}-500`}>
                {card.value}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {card.title === 'Weekly Average' ? 'Based on 4 weeks' : `Current month`}
              </p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Hours Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Lectures', value: statsData.lectureHours, color: '#1362F5' },
                      { name: 'Practice', value: statsData.practiceHours, color: '#8B5CF6' },
                      { name: 'Labs', value: statsData.labHours, color: '#EC4899' },
                      { name: 'Other', value: statsData.otherHours, color: '#10B981' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {['#1362F5', '#8B5CF6', '#EC4899', '#10B981'].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value} hours`, 'Total']}
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-gray-700 dark:text-gray-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Group Performance</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(statsData.byGroup).map(([name, hours]) => ({ name, hours }))}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6B7280' }} 
                    strokeOpacity={0}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280' }} 
                    strokeOpacity={0}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px' }}
                    formatter={(value) => <span className="text-gray-700 dark:text-gray-300">{value}</span>}
                  />
                  <Bar 
                    dataKey="hours" 
                    fill="#6366F1" 
                    radius={[4, 4, 0, 0]} 
                    name="Total Hours"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Detailed Entries</h3>
            <div className="mt-4 sm:mt-0 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                Previous
              </Button>
              <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200/50 dark:border-gray-600/50">
                <Calendar className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {monthNames[selectedMonth]} {selectedYear}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                Next
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Group', 'Subject', 'Lectures', 'Practice', 'Labs', 'Other', 'Total'].map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {displayedItems.map((item, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.group_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {item.subject_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {item.lecture_hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {item.practice_hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {item.lab_hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {item.other_hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500">
                      {item.lecture_hours + item.practice_hours + item.lab_hours + item.other_hours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {statsData.items.length > ITEMS_PER_PAGE && (
            <div className="mt-4 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllItems(!showAllItems)}
                className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                {showAllItems ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show All ({statsData.items.length})
                  </>
                )}
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {displayedItems.length} of {statsData.items.length} entries
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;