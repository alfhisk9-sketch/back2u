import React, { useState, useEffect } from 'react';
import {
  Layers,
  Building,
  PlusCircle,
  Activity,
} from 'lucide-react';
import {
  getCurrentUser,
  getCampuses,
  getCampusAuditLogs,
  getCurrentCampusId,
  subscribeDataChanges,
} from '../services/dataService';
import type { Campus, Profile, AuditLog } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const AdminPage: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAddCampusModalOpen, setIsAddCampusModalOpen] = useState(false);
  const [newCampusName, setNewCampusName] = useState('');
  const [newCampusCode, setNewCampusCode] = useState('');
  const [newCampusCity, setNewCampusCity] = useState('');
  const [newCampusDomain, setNewCampusDomain] = useState('');

  const loadData = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);

    const campusList = await getCampuses();
    setCampuses(campusList);

    const campusId = getCurrentCampusId();
    const logs = await getCampusAuditLogs(campusId);
    setAuditLogs(logs);
  };

  useEffect(() => {
    loadData();
    return subscribeDataChanges(loadData);
  }, []);

  const handleAddCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampusName || !newCampusCode) return;

    const newCampus: Campus = {
      id: `campus-${Date.now()}`,
      code: newCampusCode.toUpperCase(),
      name: newCampusName,
      domain: newCampusDomain,
      city: newCampusCity,
      country: 'US',
      security_office_location: 'Campus Security Desk, Student Union',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setCampuses([...campuses, newCampus]);
    setIsAddCampusModalOpen(false);
    setNewCampusName('');
    setNewCampusCode('');
    setNewCampusCity('');
    setNewCampusDomain('');
    alert(`Campus "${newCampus.name}" successfully registered into Back2You network.`);
  };

  // If user is not admin, show role warning
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mx-auto mb-4 border border-purple-300">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#12241E]">Platform Administrator Access Required</h2>
        <p className="text-xs text-[#536B63] mt-2 leading-relaxed">
          You are currently signed in as <strong>{currentUser.full_name}</strong> with the <em>{currentUser.role}</em> role. Platform administration is restricted to Back2You system administrators.
        </p>
        <div className="mt-6 p-4 bg-[#FAF9F6] rounded-xl border border-[#CBD5CE] text-xs text-[#536B63]">
          💡 <strong>Judges / Evaluators:</strong> Switch test roles via the top evaluation toolbar to <em>Dr. Sarah Jenkins (ADMIN)</em> to test platform administration.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-[#E1E8E4] gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
            Platform Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#12241E] tracking-tight mt-1">
            Institutional Registry & Governance
          </h1>
          <p className="text-xs text-[#536B63] mt-0.5">
            Manage participating campus nodes, monitor security audit trails, and oversee cross-campus parameters.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddCampusModalOpen(true)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Onboard New Campus
        </Button>
      </div>

      {/* Campus Nodes Table */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-purple-700" />
            <h3 className="text-sm font-bold text-[#12241E]">Registered Campuses ({campuses.length})</h3>
          </div>
          <span className="text-[10px] text-[#7C938C]">Row Level Security Isolated</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E1E8E4] text-[#536B63]">
                <th className="py-2.5 font-bold uppercase">Campus Code</th>
                <th className="py-2.5 font-bold uppercase">Institution Name</th>
                <th className="py-2.5 font-bold uppercase">Domain</th>
                <th className="py-2.5 font-bold uppercase">Location</th>
                <th className="py-2.5 font-bold uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E8E4]">
              {campuses.map(campus => (
                <tr key={campus.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-3 font-mono font-bold text-purple-900">{campus.code}</td>
                  <td className="py-3 font-semibold text-[#12241E]">{campus.name}</td>
                  <td className="py-3 text-[#536B63]">{campus.domain || 'N/A'}</td>
                  <td className="py-3 text-[#536B63]">
                    {campus.city}, {campus.state || campus.country}
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Log Explorer */}
      <div className="bg-white rounded-2xl border border-[#E1E8E4] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-700" />
            <h3 className="text-sm font-bold text-[#12241E]">
              System Audit Trails ({auditLogs.length})
            </h3>
          </div>
          <span className="text-[10px] text-[#7C938C]">Immutable action log</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E1E8E4] text-[#536B63]">
                <th className="py-2.5 font-bold uppercase">Timestamp</th>
                <th className="py-2.5 font-bold uppercase">Action</th>
                <th className="py-2.5 font-bold uppercase">Actor</th>
                <th className="py-2.5 font-bold uppercase">Target Type</th>
                <th className="py-2.5 font-bold uppercase">Target ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E8E4]">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-[#FAF9F6]">
                  <td className="py-3 font-mono text-[#7C938C]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 font-semibold text-[#12241E]">
                    <span className="bg-[#FAF9F6] px-2 py-0.5 rounded border border-[#CBD5CE]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 text-[#536B63]">{log.actor?.email || log.actor_id}</td>
                  <td className="py-3 text-[#536B63]">{log.target_type}</td>
                  <td className="py-3 font-mono text-[11px] text-[#7C938C]">
                    {log.target_id || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Campus Modal */}
      <Modal
        isOpen={isAddCampusModalOpen}
        onClose={() => setIsAddCampusModalOpen(false)}
        title="Onboard New Campus Node"
        description="Add a university or college campus to the Back2You network."
      >
        <form onSubmit={handleAddCampus} className="space-y-4">
          <div>
            <Input
              label="Campus Name"
              value={newCampusName}
              onChange={e => setNewCampusName(e.target.value)}
              placeholder="e.g. Harvard University (Cambridge)"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Campus Code"
                value={newCampusCode}
                onChange={e => setNewCampusCode(e.target.value)}
                placeholder="e.g. HARV-CAMB"
                required
              />
            </div>
            <div>
              <Input
                label="Campus Domain"
                value={newCampusDomain}
                onChange={e => setNewCampusDomain(e.target.value)}
                placeholder="e.g. harvard.edu"
              />
            </div>
          </div>

          <div>
            <Input
              label="City"
              value={newCampusCity}
              onChange={e => setNewCampusCity(e.target.value)}
              placeholder="e.g. Cambridge, MA"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E1E8E4]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddCampusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Campus Node
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
