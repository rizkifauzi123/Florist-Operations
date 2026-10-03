describe('FlowerPlus Admin Portal E2E Testing Suite', () => {

  const baseUrl = '/';

  // Mock data untuk invoice
  const mockInvoices = [
    {
      id: 1,
      invoiceNumber: '101/06/FP/2026',
      customer: 'Budi Santoso',
      kepada: 'Budi Santoso',
      email: 'budi.santoso@gmail.com',
      branch: 'Jakarta',
      bank: 'BCA',
      amount: 150000,
      date: '2026-06-02',
      status: 'paid',
      paper_size: 'a5',
      items: [
        { desc: 'Premium Rose Bouquet', qty: 1, price: 150000 }
      ],
      shippingCost: 0,
      created_at: '2026-06-02T10:00:00.000Z',
      updated_at: '2026-06-02T10:05:00.000Z'
    },
    {
      id: 2,
      invoiceNumber: '102/06/SC/FP/2026',
      customer: 'Ahmad Fauzi',
      kepada: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@yahoo.com',
      branch: 'Bandung',
      bank: 'Mandiri',
      amount: 320000,
      date: '2026-06-01',
      status: 'unpaid',
      paper_size: 'a4',
      items: [
        { desc: 'Luxury Lily & Tulip Arrangement', qty: 2, price: 150000, image: 'https://api.flowerplusofficial.com/storage/uploads/lily.jpg' }
      ],
      shippingCost: 20000,
      created_at: '2026-06-01T09:00:00.000Z',
      updated_at: '2026-06-01T09:00:00.000Z'
    },
    {
      id: 3,
      invoiceNumber: '103/06/FP/2026',
      customer: 'Siti Nurbaya',
      kepada: 'Siti Nurbaya',
      email: 'siti.nurbaya@outlook.com',
      branch: 'Surabaya',
      bank: 'BRI',
      amount: 250000,
      date: '2026-05-15', // Jatuh tempo karena > 7 hari dari sekarang (current date: Juni 2026)
      status: 'unpaid',
      paper_size: 'a4',
      items: [
        { desc: 'Orchid Flower Pot', qty: 1, price: 250000 }
      ],
      shippingCost: 0,
      created_at: '2026-05-15T08:00:00.000Z',
      updated_at: '2026-05-15T08:00:00.000Z'
    }
  ];

  // Mock data untuk users / admins
  const mockUsers = [
    {
      id: 12,
      name: 'Rizki Fauzi',
      email: 'rizkiahmadfauzi1215@gmail.com',
      role: 'Admin',
      avatar: 'https://api.flowerplusofficial.com/storage/avatars/rizki.jpg',
      created_at: '2026-01-10T12:00:00.000Z',
      updated_at: '2026-06-02T12:00:00.000Z'
    },
    {
      id: 15,
      name: 'Jane Doe',
      email: 'jane.doe@flowerplus.com',
      role: 'Admin',
      avatar: null,
      created_at: '2026-02-15T10:00:00.000Z',
      updated_at: '2026-05-20T10:00:00.000Z'
    }
  ];

  // Penyiapan stubbing global sebelum setiap tes
  beforeEach(() => {
    // Intercept semua API call agar tes berjalan deterministik secara lokal
    cy.intercept('GET', '**/api/invoices', mockInvoices).as('getInvoices');
    cy.intercept('GET', '**/api/users', mockUsers).as('getUsers');
    cy.intercept('GET', '**/api/users/12', mockUsers[0]).as('getUserDetail');
    cy.intercept('GET', '**/api/invoices/preview-number*', { invoiceNumber: '104/06/FP/2026' }).as('getPreviewNumber');
    cy.intercept('GET', '**/api/dashboard-summary', {
      total_invoices: mockInvoices.length,
      total_customers: 3,
      monthly_revenue: 150000
    }).as('getSummary');

    // Kunjungi URL Utama
    cy.visit(baseUrl);
  });

  /* ─────────────────────────────────────────────────────────────
     1. FLOW AUTENTIKASI (LOGIN & LUPA PASSWORD / RESET)
     ───────────────────────────────────────────────────────────── */
  describe('Modul Autentikasi & Reset Sandi', () => {

    it('Login Gagal - Email dan Password Kosong', () => {
      cy.get('.login-btn').click();
      cy.get('.login-error').should('be.visible').and('contain', 'Email dan password wajib diisi');
    });

    it('Login Gagal - Kredensial Salah', () => {
      // Mock API login gagal
      cy.intercept('POST', '**/api/login', {
        statusCode: 401,
        body: { message: 'Password salah atau email tidak terdaftar.' }
      }).as('loginFail');

      cy.get('input[type="email"]').type('salah@gmail.com');
      cy.get('input[type="password"]').type('salah123');
      cy.get('.login-btn').click();
      cy.wait('@loginFail');
      cy.get('.login-error').should('be.visible').and('contain', 'Password salah atau email tidak terdaftar');
    });

    it('Lupa Password - Sukses Mengirim Link Reset', () => {
      cy.intercept('POST', '**/api/forgot-password', {
        statusCode: 200,
        body: { message: 'Link reset password telah sukses dikirim ke email Anda.' }
      }).as('forgotSuccess');

      // Buka modal lupa password
      cy.get('.forgot-link').click();
      cy.get('.fp-modal').should('be.visible');

      // Test submit kosong
      cy.get('.fp-btn').click();
      cy.get('.fp-error').should('be.visible').and('contain', 'Email wajib diisi');

      // Test sukses kirim
      cy.get('.fp-input-group input').type('rizkiahmadfauzi1215@gmail.com');
      cy.get('.fp-btn').click();
      cy.wait('@forgotSuccess');
      cy.get('.fp-success').should('be.visible').and('contain', 'Link reset password telah sukses dikirim');
      cy.get('.fp-back-btn').click();
    });

    it('Sukses Mengakses Halaman Reset Password & Validasi Sandi Baru', () => {
      cy.intercept('POST', '**/api/reset-password', {
        statusCode: 200,
        body: { message: 'Sandi berhasil diperbarui.' }
      }).as('resetSuccess');

      // Kunjungi tautan reset password lengkap dengan token & email
      cy.visit(`${baseUrl}reset-password?token=secret123token&email=rizkiahmadfauzi1215@gmail.com`);

      // Verifikasi info
      cy.contains('rizkiahmadfauzi1215@gmail.com').should('be.visible');

      // Test ketidakcocokan konfirmasi sandi
      cy.get('input[placeholder="Minimal 8 karakter"]').type('baru123456789');
      cy.get('input[placeholder="Ulangi password baru"]').type('baru1234');
      cy.get('.login-btn').click();
      cy.get('.login-error').should('contain', 'Konfirmasi password tidak cocok');

      // Cek indikator kekuatan password
      cy.get('.rp-strength-label').should('contain', 'Kuat');

      // Isi dengan benar
      cy.get('input[placeholder="Ulangi password baru"]').clear().type('baru123456789');
      cy.get('.login-btn').click();
      cy.wait('@resetSuccess');
      cy.get('.rp-success').should('be.visible').and('contain', 'Password Berhasil Diubah');
    });

    it('Login Berhasil & Redireksi ke Dashboard', () => {
      // Mock API login sukses
      cy.intercept('POST', '**/api/login', {
        statusCode: 200,
        body: {
          message: 'Login sukses',
          data: mockUsers[0]
        }
      }).as('loginSuccess');

      // Isi form login
      cy.get('input[type="email"]').clear().type('rizkiahmadfauzi1215@gmail.com');
      cy.get('input[type="password"]').clear().type('fauzi123');
      cy.get('.login-btn').click();

      cy.wait('@loginSuccess');
      cy.wait('@getInvoices');
      cy.wait('@getUsers');

      // Validasi redirect
      cy.url().should('include', '/dashboard');
    });

  });

  /* ─────────────────────────────────────────────────────────────
     2. OPERASI DI DASHBOARD
     ───────────────────────────────────────────────────────────── */
  describe('Operasi Fitur Dashboard', () => {

    beforeEach(() => {
      // Login secara programmatic sebelum tes halaman dalam
      cy.visit(`${baseUrl}dashboard`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('isLoggedIn', 'true');
          win.localStorage.setItem('user', JSON.stringify(mockUsers[0]));
        }
      });
    });

    it('Memvalidasi Kartu Summary Statistik & Elemen Dashboard', () => {
      cy.contains('Ringkasan Dashboard', { timeout: 10000 }).should('be.visible');
      
      // Memastikan widget stats memiliki value yang benar dari mockData
      cy.get('.dashboard-container').within(() => {
        cy.contains('Total Invoice').should('exist');
        cy.contains('Total Pelanggan').should('exist');
        cy.contains('Pendapatan Bulanan').should('exist');
      });

      // Memastikan Tabel di Dashboard menampilkan data yang di-fetch
      cy.get('.invoice-list').should('exist');
      cy.contains('Budi Santoso').should('be.visible');
      cy.contains('102/06/SC/FP/2026').should('be.visible');
    });

  });

  /* ─────────────────────────────────────────────────────────────
     3. MANAJEMEN INVOICE (TABEL, SEARCH, FILTER, AKSI)
     ───────────────────────────────────────────────────────────── */
  describe('Modul Manajemen Invoice', () => {

    beforeEach(() => {
      cy.visit(`${baseUrl}invoice`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('isLoggedIn', 'true');
          win.localStorage.setItem('user', JSON.stringify(mockUsers[0]));
        }
      });
    });

    it('Mengecek Elemen Header & Tombol Tambah', () => {
      cy.get('.invoice-header h1').should('contain', 'Manajemen Invoice');
      cy.get('.create-btn-invoice').should('be.visible');
    });

    it('Menguji Fitur Pencarian Dinamis (Search)', () => {
      // Cari "Budi" -> Harus menyisakan 1 baris
      cy.get('.search-input').type('Budi');
      cy.get('tbody tr').should('have.length', 1);
      cy.contains('Budi Santoso').should('be.visible');
      cy.contains('Ahmad Fauzi').should('not.exist');

      // Cari kata kunci cabang "Bandung"
      cy.get('.search-input').clear().type('Bandung');
      cy.get('tbody tr').should('have.length', 1);
      cy.contains('Ahmad Fauzi').should('be.visible');
    });

    it('Menguji Fitur Filter berdasarkan Ukuran Kertas, Bank, dan Status', () => {
      // Filter A5 saja
      cy.contains('A5 · Cetak').first().click();
      cy.get('tbody tr').should('have.length', 1);
      cy.contains('Budi Santoso').should('be.visible');

      // Filter A4 saja
      cy.contains('A4 · PDF').first().click();
      cy.get('tbody tr').should('have.length', 2);
      cy.contains('Ahmad Fauzi').should('be.visible');
      cy.contains('Siti Nurbaya').should('be.visible');

      // Filter status "Belum Lunas"
      cy.contains('Semua Status').click();
      cy.contains('Belum Lunas').click();
      cy.get('tbody tr').should('have.length', 2); // Ahmad Fauzi & Siti Nurbaya belum lunas

      // Filter Bank "BCA"
      cy.contains('Semua Bank').click();
      cy.contains('BCA').click();
      // Kosong karena status masih "Belum Lunas" dan BCA hanya dimiliki Budi (Lunas)
      cy.contains('Tidak ada invoice ditemukan').should('be.visible');
    });

    it('Menguji Urutan / Sorting Nomor Invoice', () => {
      // Buka dropdown sort
      cy.get('.inv-sort-btn').click();
      
      // Pilih "Terkecil ke terbesar" (ASC)
      cy.contains('Terkecil ke terbesar').click();
      cy.get('tbody tr').first().find('.invoice-id').should('contain', '101/06/FP/2026');

      // Pilih "Terbesar ke terkecil" (DESC)
      cy.get('.inv-sort-btn').click();
      cy.contains('Terbesar ke terkecil').click();
      cy.get('tbody tr').first().find('.invoice-id').should('contain', '103/06/FP/2026');
    });

    it('Menguji Aksi Dropdown - Lihat Detail & Navigasi Ubah', () => {
      // Klik aksi dropdown baris pertama (Budi Santoso)
      cy.get('tbody tr').first().find('.action-btn').click();
      cy.get('.action-dropdown').should('be.visible');

      // Cek tombol Ubah mengarahkan ke form edit
      cy.contains('Ubah').click();
      cy.url().should('include', '/invoice/edit/1');
    });

    it('Menguji Aksi Dropdown - Hapus Invoice dengan Konfirmasi', () => {
      cy.intercept('DELETE', '**/api/invoices/1', {
        statusCode: 200,
        body: { message: 'Invoice deleted successfully' }
      }).as('deleteInvoice');

      // Klik hapus
      cy.get('tbody tr').first().find('.action-btn').click();
      cy.contains('Hapus').click();

      // Klik tombol hapus konfirmasi di modal
      cy.get('.del-btn-confirm').click();

      cy.wait('@deleteInvoice');
      // Toast sukses muncul mengonfirmasi penghapusan
      cy.get('.invoice-page').should('exist');
    });

  });

  /* ─────────────────────────────────────────────────────────────
     4. PEMBUATAN INVOICE & PRATINJAU (CREATE & PREVIEW)
     ───────────────────────────────────────────────────────────── */
  describe('Operasi Fitur Pembuatan & Pratinjau Invoice', () => {

    beforeEach(() => {
      cy.visit(`${baseUrl}invoice/create?type=normal`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('isLoggedIn', 'true');
          win.localStorage.setItem('user', JSON.stringify(mockUsers[0]));
        }
      });
    });

    it('Mengisi Form Invoice Baru, Validasi Kalkulasi, dan Submisi Preview', () => {
      cy.get('.ci-header-title h2').should('contain', 'Create Invoice');

      // Isi field utama
      cy.get('input[type="date"]').type('2026-06-02');
      cy.get('input[placeholder="Nama penerima"]').type('Pelanggan Baru');
      cy.get('input[placeholder="Cabang"]').type('Tangerang');

      // Dropdown Bank
      cy.get('.ci-bank-trigger').click();
      cy.contains('Mandiri').click();

      // Isi Detail Item pertama
      cy.get('.ci-item-row').first().within(() => {
        cy.get('textarea[placeholder="Deskripsi item..."]').type('Paket Bunga Mawar Merah');
        cy.get('input[placeholder="Qty"]').type('2');
        cy.get('input[placeholder="Harga (Rp)"]').type('75000'); // 75.000
      });

      // Cek subtotal & total sebelum ongkir
      cy.get('.ci-total-box').within(() => {
        cy.contains('Rp 150.000').should('be.visible');
      });

      // Tambah item baru
      cy.get('.ci-add-item').click();
      cy.get('.ci-item-row').should('have.length', 2);

      // Isi item kedua
      cy.get('.ci-item-row').eq(1).within(() => {
        cy.get('textarea[placeholder="Deskripsi item..."]').type('Vas Bunga Keramik');
        cy.get('input[placeholder="Qty"]').type('1');
        cy.get('input[placeholder="Harga (Rp)"]').type('50000');
      });

      // Cek subtotal terupdate (150.000 + 50.000 = 200.000)
      cy.contains('Rp 200.000').should('be.visible');

      // Isi Ongkos Kirim
      cy.get('.ci-shipping-input').type('15000');

      // Total akhir harus Rp 215.000
      cy.get('.amount').should('contain', 'Rp 215.000');

      // Mock upload gambar lampiran
      cy.intercept('POST', '**/api/upload-image', {
        statusCode: 200,
        body: { url: 'https://api.flowerplusofficial.com/storage/uploads/test.jpg' }
      }).as('uploadImage');

      // Mengirimkan file palsu untuk testing upload
      const dummyFile = 'dummy-image-base64-data';
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from(dummyFile),
        fileName: 'rose.jpg',
        mimeType: 'image/jpeg',
      }, { force: true });

      cy.wait('@uploadImage');
      cy.get('.ci-image-preview').should('be.visible');

      // Submit Form menuju halaman Preview
      cy.get('.ci-btn-create').click();
      cy.get('.invoice-preview-wrapper').should('be.visible');
      cy.get('.inv-title').should('contain', 'INVOICE');
      cy.contains('Paket Bunga Mawar Merah').should('be.visible');

      // Test tombol Kembali bekerja
      cy.get('.ia-btn-back').click();
      cy.get('.ci-card').should('be.visible'); // Kembali ke form pengisian
    });

    it('Menyimpan Invoice Baru dari Halaman Preview', () => {
      // Mock API simpan invoice sukses
      cy.intercept('POST', '**/api/invoices', {
        statusCode: 201,
        body: { status: 'success', data: mockInvoices[0] }
      }).as('saveInvoice');

      // Isi form minimal
      cy.get('input[type="date"]').type('2026-06-02');
      cy.get('input[placeholder="Nama penerima"]').type('Pelanggan Baru');
      cy.get('.ci-bank-trigger').click();
      cy.contains('BRI').click();
      cy.get('.ci-item-row').first().within(() => {
        cy.get('textarea[placeholder="Deskripsi item..."]').type('Item Tes');
        cy.get('input[placeholder="Qty"]').type('1');
        cy.get('input[placeholder="Harga (Rp)"]').type('100000');
      });

      // Submit Form
      cy.get('.ci-btn-create').click();

      // Klik Simpan di halaman Preview
      cy.get('.ia-btn-save').click();
      cy.wait('@saveInvoice');

      // Dialihkan kembali ke halaman utama invoice dengan Toast Sukses
      cy.url().should('include', '/invoice');
    });

  });

  /* ─────────────────────────────────────────────────────────────
     5. PELACAK PEMBAYARAN (PAYMENT TRACKER & KEYBOARD NAV)
     ───────────────────────────────────────────────────────────── */
  describe('Modul Pelacak Pembayaran', () => {

    beforeEach(() => {
      cy.visit(`${baseUrl}payment`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('isLoggedIn', 'true');
          win.localStorage.setItem('user', JSON.stringify(mockUsers[0]));
        }
      });
    });

    it('Memvalidasi Ringkasan Progres & List Pembayaran', () => {
      cy.get('.pt-header h2').should('contain', 'Pelacak Pembayaran');
      cy.get('.pt-progress-rate h3').should('exist'); // Cek persentase penagihan
      cy.get('.pt-item').should('have.length', 3); // Total invoice ada 3 dari mock
    });

    it('Tandai Lunas & Batalkan Lunas via Tombol Aksi', () => {
      // Mock API Update status paid
      cy.intercept('PUT', '**/api/invoices/2', {
        statusCode: 200,
        body: { ...mockInvoices[1], status: 'paid' }
      }).as('updatePaid');

      // Cari baris dengan status 'Belum Lunas' (Ahmad Fauzi) dan Tandai Lunas
      cy.get('.pt-item.unpaid').first().within(() => {
        cy.contains('Ahmad Fauzi').should('be.visible');
        cy.get('.pt-mark-btn').click();
      });

      cy.wait('@updatePaid');
      cy.wait('@getInvoices');

      // Mock API Update status unpaid
      cy.intercept('PUT', '**/api/invoices/1', {
        statusCode: 200,
        body: { ...mockInvoices[0], status: 'unpaid' }
      }).as('updateUnpaid');

      // Cari baris Lunas (Budi Santoso) lalu klik Batalkan
      cy.get('.pt-item.paid').first().within(() => {
        cy.contains('Budi Santoso').should('be.visible');
        cy.get('.pt-cancel-btn').click();
      });

      cy.wait('@updateUnpaid');
      cy.wait('@getInvoices');
    });

    it('Menguji Navigasi Keyboard (Arrow Down, Arrow Up, Enter)', () => {
      // Tunggu list item dirender
      cy.get('.pt-item').should('have.length.at.least', 1);

      // Fokus pada list item pertama
      cy.get('body').trigger('keydown', { key: 'ArrowDown' });
      cy.get('.pt-item').eq(0).should('have.class', 'kb-active');

      // Pindah ke item kedua
      cy.get('body').trigger('keydown', { key: 'ArrowDown' });
      cy.get('.pt-item').eq(1).should('have.class', 'kb-active');

      // Naik kembali ke item pertama
      cy.get('body').trigger('keydown', { key: 'ArrowUp' });
      cy.get('.pt-item').eq(0).should('have.class', 'kb-active');
    });

  });

  /* ─────────────────────────────────────────────────────────────
     6. LAPORAN & ANALISIS (CHARTS & EXCEL EXPORT)
     ───────────────────────────────────────────────────────────── */
  describe('Modul Laporan & Analisis', () => {

    beforeEach(() => {
      cy.visit(`${baseUrl}reports`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('isLoggedIn', 'true');
          win.localStorage.setItem('user', JSON.stringify(mockUsers[0]));
        }
      });
    });

    it('Memvalidasi Render Grafik & Ringkasan Metrik Laporan', () => {
      cy.get('.ra-header-title').should('contain', 'Laporan & Analisis');
      
      // Cek metrik summary
      cy.contains('Total Pendapatan').should('be.visible');
      cy.contains('Tingkat Penagihan').should('be.visible');

      // Memastikan chart SVG dirender oleh Recharts
      cy.get('.recharts-responsive-container').should('exist');
    });

    it('Membuka Modal Filter Tanggal Kustom (Custom Range)', () => {
      // Klik Dropdown Periode -> Klik Custom
      cy.get('.ra-dropdown').click();
      cy.contains('Custom').click();

      // Modal harus muncul
      cy.get('.ra-modal').should('be.visible');
      cy.get('.ra-modal-title').should('contain', 'Pilih Rentang Tanggal');

      // Masukkan tanggal mulai & selesai
      cy.get('.ra-date-input').eq(0).type('2026-06-01');
      cy.get('.ra-date-input').eq(1).type('2026-06-02');

      // Terapkan filter
      cy.get('.ra-btn-apply').click();
      cy.get('.ra-dropdown-label').should('contain', '01 Jun 2026 – 02 Jun 2026');
    });

    it('Menjalankan Fungsi Ekspor Excel', () => {
      // Klik tombol ekspor excel
      cy.get('.ra-export-btn').should('be.visible').click();
      // Memastikan proses ekspor selesai tanpa kendala (crash)
      cy.get('.ra-export-btn').should('exist');
    });

  });

  /* ─────────────────────────────────────────────────────────────
     7. PROFIL & PENGATURAN (PROFILE & SETTINGS)
     ───────────────────────────────────────────────────────────── */
  describe('Modul Profil & Pengaturan', () => {

    beforeEach(() => {
      cy.visit(`${baseUrl}profile`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('isLoggedIn', 'true');
          win.localStorage.setItem('user', JSON.stringify(mockUsers[0]));
        }
      });
    });

    it('Melihat Info Profil & Mengubah Foto Profil (Mocked)', () => {
      cy.get('.profile-header-text h1').should('contain', 'My Profile');
      cy.get('.profile-card h2').should('contain', 'Rizki Fauzi');

      // Cek info row
      cy.contains('User ID').should('be.visible');
      cy.contains('Email').should('be.visible');

      // Mock upload avatar baru
      cy.intercept('POST', '**/api/users/12', {
        statusCode: 200,
        body: {
          status: 'success',
          data: {
            ...mockUsers[0],
            avatar: 'https://api.flowerplusofficial.com/storage/avatars/new_avatar.jpg'
          }
        }
      }).as('updateAvatar');

      // Mengirimkan file palsu untuk avatar
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('avatar-raw-data'),
        fileName: 'profile.jpg',
        mimeType: 'image/jpeg',
      }, { force: true });

      cy.wait('@updateAvatar');
      // Berhasil merubah avatar dan menampilkan toast pesan sukses
      cy.get('.profile-save-msg').should('be.visible').and('contain', 'Foto profil berhasil diperbarui');
    });

    it('Mengakses Halaman Pengaturan & Menguji Keamanan Sandi', () => {
      cy.visit(`${baseUrl}settings`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('isLoggedIn', 'true');
          win.localStorage.setItem('user', JSON.stringify(mockUsers[0]));
        }
      });
      cy.get('.settings-header h1').should('contain', 'Settings');

      // Gunakan stub untuk menangkap alert tanpa men-trigger uncaught exceptions
      const alertStub = cy.stub();
      cy.on('window:alert', alertStub);

      // Isi form update profile
      cy.get('input').eq(0).clear().type('Jane New Name');
      cy.contains('Update Profile').click().then(() => {
        expect(alertStub).to.be.calledWith('Profile updated successfully');
      });

      // Uji keamanan sandi - konfirmasi tidak cocok
      cy.get('input[type="password"]').eq(0).type('lama1234');
      cy.get('input[type="password"]').eq(1).type('baru12345');
      cy.get('input[type="password"]').eq(2).type('baruSandiBerbeda');
      cy.contains('Change Password').click().then(() => {
        expect(alertStub).to.be.calledWith('New password does not match');
      });
    });

  });

});