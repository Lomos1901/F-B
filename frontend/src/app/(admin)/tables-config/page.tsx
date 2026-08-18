'use client';

import { useState, useEffect } from 'react';
import { tableService, TableInfo } from '@/src/services/tableService';
import { Plus, Edit, Trash2, Search, LayoutDashboard, Loader2, MapPin, QrCode, Printer } from 'lucide-react';
import { toast } from 'react-toastify';
import { QRCodeSVG } from 'qrcode.react';
import ConfirmModal from '@/src/components/ConfirmModal';

export default function TablesConfigPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableInfo | null>(null);
  const [formData, setFormData] = useState({ name: '', zone: '', is_active: true });
  const [saving, setSaving] = useState(false);

  // Confirm delete states
  const [tableToDelete, setTableToDelete] = useState<{id: string, name: string} | null>(null);

  // Zone management states
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneFormData, setZoneFormData] = useState({ name: '', tableCount: 5, prefix: 'Bàn ' });
  
  const [isRenameZoneModalOpen, setIsRenameZoneModalOpen] = useState(false);
  const [renameZoneData, setRenameZoneData] = useState({ oldName: '', newName: '' });

  // QR states
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrTable, setQrTable] = useState<TableInfo | null>(null);
  const [originUrl, setOriginUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await tableService.getTables();
      setTables(data);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi tải danh sách bàn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleOpenModal = (table?: TableInfo) => {
    if (table) {
      setEditingTable(table);
      setFormData({ name: table.name, zone: table.zone, is_active: table.is_active ?? true });
    } else {
      setEditingTable(null);
      setFormData({ name: '', zone: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.zone.trim()) {
      toast.error('Vui lòng nhập đầy đủ Tên bàn và Khu vực');
      return;
    }

    setSaving(true);
    try {
      if (editingTable) {
        await tableService.updateTable(editingTable.id, formData);
        toast.success('Cập nhật bàn thành công');
      } else {
        await tableService.createTable(formData);
        toast.success('Thêm bàn mới thành công');
      }
      handleCloseModal();
      fetchTables();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu bàn');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!tableToDelete) return;
    try {
      await tableService.deleteTable(tableToDelete.id);
      toast.success(`Đã xóa ${tableToDelete.name}`);
      fetchTables();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi xóa bàn');
    } finally {
      setTableToDelete(null);
    }
  };

  const handleQuickAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneFormData.name.trim()) {
      toast.error('Vui lòng nhập tên khu vực');
      return;
    }
    setSaving(true);
    try {
      const promises = [];
      for (let i = 1; i <= zoneFormData.tableCount; i++) {
        promises.push(
          tableService.createTable({
            name: `${zoneFormData.prefix}${i}`,
            zone: zoneFormData.name,
            is_active: true
          })
        );
      }
      await Promise.all(promises);
      toast.success(`Đã tạo khu vực ${zoneFormData.name} với ${zoneFormData.tableCount} bàn`);
      setIsZoneModalOpen(false);
      fetchTables();
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi tạo khu vực');
    } finally {
      setSaving(false);
    }
  };

  const handleRenameZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameZoneData.newName.trim() || renameZoneData.newName === renameZoneData.oldName) {
      toast.error('Vui lòng nhập tên khu vực mới');
      return;
    }
    setSaving(true);
    try {
      const tablesInZone = tables.filter(t => t.zone === renameZoneData.oldName);
      const promises = tablesInZone.map(t => 
        tableService.updateTable(t.id, { zone: renameZoneData.newName })
      );
      await Promise.all(promises);
      toast.success('Đổi tên khu vực thành công');
      setIsRenameZoneModalOpen(false);
      fetchTables();
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi đổi tên khu vực');
    } finally {
      setSaving(false);
    }
  };

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by zone
  const zones = Array.from(new Set(filteredTables.map(t => t.zone))).sort();

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 print:p-0 print:bg-white">
      <div className="max-w-6xl mx-auto space-y-6 print:hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
              <LayoutDashboard className="text-blue-600" />
              Quản lý Sơ đồ bàn
            </h1>
            <p className="text-sm text-slate-500 mt-1">Thiết lập danh sách bàn và khu vực cho thu ngân</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setZoneFormData({ name: '', tableCount: 5, prefix: 'Bàn ' });
                setIsZoneModalOpen(true);
              }}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-full font-medium transition-colors shadow-sm border border-slate-200"
            >
              <MapPin size={20} />
              Thêm Khu Vực
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-sm"
            >
              <Plus size={20} />
              Thêm Bàn
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên bàn hoặc khu vực..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : (
          <div className="space-y-8">
            {zones.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500">Không tìm thấy bàn nào.</p>
              </div>
            ) : (
              zones.map(zone => (
                <div key={zone} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MapPin className="text-slate-500" size={18} />
                      <h2 className="font-bold text-lg text-slate-800">{zone}</h2>
                      <span className="ml-2 bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                        {filteredTables.filter(t => t.zone === zone).length} bàn
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setRenameZoneData({ oldName: zone, newName: zone });
                        setIsRenameZoneModalOpen(true);
                      }}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <Edit size={14} />
                      Đổi tên
                    </button>
                  </div>
                  <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredTables.filter(t => t.zone === zone).map(table => (
                      <div 
                        key={table.id}
                        className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all h-28 ${
                          table.is_active 
                            ? 'bg-white border-slate-200 hover:border-blue-300' 
                            : 'bg-slate-100 border-slate-200 opacity-60'
                        }`}
                      >
                        <span className={`font-bold text-lg ${table.is_active ? 'text-slate-800' : 'text-slate-400'}`}>
                          {table.name}
                        </span>
                        {!table.is_active && (
                          <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Đang tắt</span>
                        )}

                        {/* Actions overlay */}
                        <div className="absolute inset-0 bg-slate-900/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                          <button 
                            onClick={() => {
                              setQrTable(table);
                              setIsQrModalOpen(true);
                            }}
                            className="p-2 bg-white text-purple-600 hover:bg-purple-50 rounded-full shadow-sm transition-colors"
                            title="Mã QR"
                          >
                            <QrCode size={16} />
                          </button>
                          <button 
                            onClick={() => handleOpenModal(table)}
                            className="p-2 bg-white text-blue-600 hover:bg-blue-50 rounded-full shadow-sm transition-colors"
                            title="Sửa"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => setTableToDelete({id: table.id, name: table.name})}
                            className="p-2 bg-white text-red-600 hover:bg-red-50 rounded-full shadow-sm transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">
                {editingTable ? 'Sửa thông tin bàn' : 'Thêm bàn mới'}
              </h3>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên bàn (VD: Bàn 1)</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Khu vực (VD: Tầng 1)</label>
                <input 
                  type="text" 
                  value={formData.zone}
                  onChange={e => setFormData({...formData, zone: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  list="zone-suggestions"
                />
                <datalist id="zone-suggestions">
                  {zones.map(z => <option key={z} value={z} />)}
                </datalist>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className="text-sm font-medium text-slate-700">Đang hoạt động (Hiển thị ở thu ngân)</span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Khu Vực */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">Thêm Khu Vực Nhanh</h3>
            </div>
            
            <form onSubmit={handleQuickAddZone} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên khu vực (VD: Sân thượng)</label>
                <input 
                  type="text" 
                  value={zoneFormData.name}
                  onChange={e => setZoneFormData({...zoneFormData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số lượng bàn</label>
                  <input 
                    type="number" 
                    min="1" max="50"
                    value={zoneFormData.tableCount}
                    onChange={e => setZoneFormData({...zoneFormData, tableCount: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tiền tố tên bàn</label>
                  <input 
                    type="text" 
                    value={zoneFormData.prefix}
                    onChange={e => setZoneFormData({...zoneFormData, prefix: e.target.value})}
                    placeholder="VD: Bàn "
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Hệ thống sẽ tự động tạo {zoneFormData.tableCount} bàn với tên từ "{zoneFormData.prefix}1" đến "{zoneFormData.prefix}{zoneFormData.tableCount}".
              </p>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsZoneModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'Tạo nhanh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi tên Khu Vực */}
      {isRenameZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">Đổi tên khu vực</h3>
            </div>
            
            <form onSubmit={handleRenameZone} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên khu vực mới cho "{renameZoneData.oldName}"</label>
                <input 
                  type="text" 
                  value={renameZoneData.newName}
                  onChange={e => setRenameZoneData({...renameZoneData, newName: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsRenameZoneModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'Đổi tên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mã QR */}
      {isQrModalOpen && qrTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:bg-white print:p-0 print:backdrop-blur-none">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:w-full print:max-w-none">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 print:hidden">
              <h3 className="font-bold text-lg text-slate-800">Mã QR - {qrTable.name}</h3>
              <button onClick={() => setIsQrModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center print:p-0 print:h-screen print:justify-center">
              <div className="text-center mb-6 print:mb-10">
                <h2 className="text-4xl font-extrabold text-slate-800 mb-3">SAMCAFFEE</h2>
                <p className="text-3xl font-bold text-slate-600">{qrTable.name}</p>
                <p className="text-xl text-slate-500 mt-2">{qrTable.zone}</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 print:border-4 print:border-black print:shadow-none mb-8">
                <QRCodeSVG 
                  value={`${originUrl}/qr-order?tableId=${qrTable.id}&tableName=${encodeURIComponent(qrTable.name)}`}
                  size={300}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-lg text-slate-500 font-medium text-center px-4 print:text-black print:text-2xl">
                Quét mã QR để xem Menu & Đặt món
              </p>
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-100 bg-slate-50 print:hidden">
              <button 
                type="button" 
                onClick={() => setIsQrModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Đóng
              </button>
              <button 
                type="button" 
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={18} /> In mã QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!tableToDelete}
        title="Xóa bàn"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn "${tableToDelete?.name}"? Các hóa đơn cũ của bàn này vẫn sẽ được giữ lại.`}
        onConfirm={confirmDelete}
        onCancel={() => setTableToDelete(null)}
        type="danger"
        confirmText="Xóa bàn"
      />
    </div>
  );
}
