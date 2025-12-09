import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { formatTransitionTable } from '../../utils/formatters';

export const TransitionTable = ({ automaton, title, stateMapping }) => {
  if (!automaton) return null;

  const { headers, rows } = formatTransitionTable(automaton);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full"
    >
      <Card>
        <CardHeader>
          <CardTitle>{title || 'Transition Table'}</CardTitle>
        </CardHeader>
        <CardContent>

          {/* bg-color, hover bg color, padding of each cell, and lowercase chnages in index.css */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  {headers.map((header) => ( <th key={header} className="lowercase">{header}</th>))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td className="font-semibold text-indigo-600">
                      {row.state}
                      {automaton.startState === row.state && (
                        <span className="ml-2 badge badge-success text-xs">Start</span>
                      )}
                      {automaton.finalStates.includes(row.state) && (
                        <span className="ml-2 badge badge-info text-xs">Final</span>
                      )}
                      {automaton.deadState === row.state && (
                        <span className="ml-2 badge badge-error text-xs">Dead</span>
                      )}
                    </td>
                    {headers.slice(1).map((header) => (
                      <td key={header} className="font-mono text-sm text-slate-700">
                        {row[header] === '-' ? (
                          <span className="text-slate-400">∅</span>
                        ) : (
                          row[header]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* State Mapping Info */}
          {stateMapping && Object.keys(stateMapping).length > 0 && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-3">State Mapping:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(stateMapping).map(([newState, oldStates]) => (
                  <div
                    key={newState}
                    className="flex items-center gap-2 text-sm bg-white rounded-md p-3 border border-slate-200"
                  >
                    <span className="font-semibold text-indigo-600 font-mono">{newState} </span>
                    <span className="text-slate-400">=</span>
                    <span className="text-slate-700 font-mono">
                      {'{'}
                      {Array.isArray(oldStates) ? oldStates.join(', ') : oldStates}
                      {'}'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};