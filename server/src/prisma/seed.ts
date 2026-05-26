import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Chama OS database...\n');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.meetingAttendance.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.loanRepayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.contributionCycle.deleteMany();
  await prisma.chamaMember.deleteMany();
  await prisma.mpesaTransaction.deleteMany();
  await prisma.chama.deleteMany();
  await prisma.user.deleteMany();

  console.log('  ✓ Cleaned existing data');

  // ─── Create Users ──────────────────────────────────────────────
  const pinHash = await bcrypt.hash('1234', 12);

  const wanjiku = await prisma.user.create({
    data: {
      phone: '254712345678',
      pin_hash: pinHash,
      name: 'Wanjiku Kamau',
      national_id: '12345678',
    },
  });

  const omondi = await prisma.user.create({
    data: {
      phone: '254723456789',
      pin_hash: pinHash,
      name: 'Omondi Otieno',
      national_id: '23456789',
    },
  });

  const njeri = await prisma.user.create({
    data: {
      phone: '254734567890',
      pin_hash: pinHash,
      name: 'Njeri Mwangi',
      national_id: '34567890',
    },
  });

  console.log('  ✓ Created 3 test users (PIN: 1234)');

  // ─── Create Chama ─────────────────────────────────────────────
  const chama = await prisma.chama.create({
    data: {
      name: 'Fahari ya Nairobi Chama',
      description: 'A trusted investment group for professionals in Nairobi. We save together, grow together, and prosper together.',
      frequency: 'monthly',
      contribution_amount: 5000,
      start_date: new Date('2025-11-01'),
      max_members: 20,
      invite_code: 'FAHARI2025',
      created_by_id: wanjiku.id,
    },
  });

  console.log(`  ✓ Created chama: "${chama.name}"`);

  // ─── Add Members ──────────────────────────────────────────────
  const memberWanjiku = await prisma.chamaMember.create({
    data: { chama_id: chama.id, user_id: wanjiku.id, role: 'CHAIRMAN' },
  });

  const memberOmondi = await prisma.chamaMember.create({
    data: { chama_id: chama.id, user_id: omondi.id, role: 'TREASURER' },
  });

  const memberNjeri = await prisma.chamaMember.create({
    data: { chama_id: chama.id, user_id: njeri.id, role: 'SECRETARY' },
  });

  console.log('  ✓ Added 3 members with roles (Chairman, Treasurer, Secretary)');

  // ─── Create 6 Months of Contribution Cycles ───────────────────
  const cycles = [];
  for (let i = 0; i < 6; i++) {
    const dueDate = new Date('2025-12-01');
    dueDate.setMonth(dueDate.getMonth() + i);

    const isPast = dueDate < new Date();
    const cycle = await prisma.contributionCycle.create({
      data: {
        chama_id: chama.id,
        due_date: dueDate,
        amount: 5000,
        cycle_number: i + 1,
        status: isPast ? 'CLOSED' : (i === 4 ? 'OPEN' : 'UPCOMING'),
      },
    });
    cycles.push(cycle);
  }

  console.log('  ✓ Created 6 contribution cycles');

  // ─── Create Contributions (mixed statuses) ─────────────────────
  const members = [memberWanjiku, memberOmondi, memberNjeri];
  const statuses = [
    // Cycle 1: All paid
    ['PAID', 'PAID', 'PAID'],
    // Cycle 2: Wanjiku paid, Omondi late, Njeri paid
    ['PAID', 'LATE', 'PAID'],
    // Cycle 3: All paid
    ['PAID', 'PAID', 'PAID'],
    // Cycle 4: Wanjiku paid, Omondi paid, Njeri late
    ['PAID', 'PAID', 'LATE'],
    // Cycle 5 (current): Wanjiku paid, others pending
    ['PAID', 'PENDING', 'PENDING'],
    // Cycle 6 (upcoming): All pending
    ['PENDING', 'PENDING', 'PENDING'],
  ];

  const mpesaRefs = ['QHE72KL4M0', 'RJF83NM5P1', 'SKG94ON6Q2', 'TLH05PO7R3', 'UMI16QP8S4'];

  for (let c = 0; c < cycles.length; c++) {
    for (let m = 0; m < members.length; m++) {
      const status = statuses[c][m];
      const isPaid = status === 'PAID';
      const isLate = status === 'LATE';

      await prisma.contribution.create({
        data: {
          cycle_id: cycles[c].id,
          member_id: members[m].id,
          amount_paid: isPaid || isLate ? 5000 : 0,
          paid_at: isPaid || isLate
            ? new Date(cycles[c].due_date.getTime() + (isLate ? 5 * 24 * 60 * 60 * 1000 : -1 * 24 * 60 * 60 * 1000))
            : null,
          mpesa_ref: isPaid || isLate ? mpesaRefs[c % mpesaRefs.length] + m : null,
          status: status as any,
          penalty_amount: isLate ? 200 : 0,
        },
      });
    }
  }

  console.log('  ✓ Created 18 contribution records (mixed paid/late/pending)');

  // ─── Create Loans ─────────────────────────────────────────────
  // Loan 1: Active loan for Omondi
  const activeLoan = await prisma.loan.create({
    data: {
      chama_id: chama.id,
      applicant_id: memberOmondi.id,
      amount: 30000,
      purpose: 'Business expansion - buying stock for my electronics shop in Eastlands',
      status: 'DISBURSED',
      applied_at: new Date('2026-02-10'),
      approved_at: new Date('2026-02-12'),
      disbursed_at: new Date('2026-02-15'),
      interest_rate: 10,
      repayment_months: 3,
    },
  });

  // Repayment schedule for active loan
  const loanTotal = 30000 * 1.1; // 10% interest
  const monthlyPayment = Math.ceil(loanTotal / 3);
  for (let i = 0; i < 3; i++) {
    const dueDate = new Date('2026-03-15');
    dueDate.setMonth(dueDate.getMonth() + i);

    await prisma.loanRepayment.create({
      data: {
        loan_id: activeLoan.id,
        amount: i === 2 ? loanTotal - monthlyPayment * 2 : monthlyPayment,
        due_date: dueDate,
        paid_at: i === 0 ? new Date('2026-03-14') : null,
        mpesa_ref: i === 0 ? 'VNJ27RQ9T5' : null,
        status: i === 0 ? 'PAID' : 'PENDING',
      },
    });
  }

  // Loan 2: Fully repaid loan for Wanjiku
  const repaidLoan = await prisma.loan.create({
    data: {
      chama_id: chama.id,
      applicant_id: memberWanjiku.id,
      amount: 15000,
      purpose: 'School fees for daughter - Term 2 at Precious Blood Riruta',
      status: 'REPAID',
      applied_at: new Date('2025-12-05'),
      approved_at: new Date('2025-12-07'),
      disbursed_at: new Date('2025-12-10'),
      interest_rate: 10,
      repayment_months: 3,
    },
  });

  const repaidTotal = 15000 * 1.1;
  const repaidMonthly = Math.ceil(repaidTotal / 3);
  for (let i = 0; i < 3; i++) {
    const dueDate = new Date('2026-01-10');
    dueDate.setMonth(dueDate.getMonth() + i);

    await prisma.loanRepayment.create({
      data: {
        loan_id: repaidLoan.id,
        amount: i === 2 ? repaidTotal - repaidMonthly * 2 : repaidMonthly,
        due_date: dueDate,
        paid_at: new Date(dueDate.getTime() - 2 * 24 * 60 * 60 * 1000),
        mpesa_ref: `WOK38SR${i}U6`,
        status: 'PAID',
      },
    });
  }

  console.log('  ✓ Created 2 loans (1 active with repayments, 1 fully repaid)');

  // ─── Create Investments ────────────────────────────────────────
  await prisma.investment.create({
    data: {
      chama_id: chama.id,
      name: 'CIC Money Market Fund',
      institution: 'CIC Asset Management',
      amount: 100000,
      roi_expected: 11.5,
      maturity_date: new Date('2027-06-01'),
      status: 'ACTIVE',
    },
  });

  await prisma.investment.create({
    data: {
      chama_id: chama.id,
      name: 'Land - Juja Plot (1/8 Acre)',
      institution: 'Private Purchase',
      amount: 450000,
      roi_expected: 25,
      maturity_date: new Date('2028-12-31'),
      status: 'ACTIVE',
    },
  });

  console.log('  ✓ Created 2 investments (Money Market + Land)');

  // ─── Create Meeting ───────────────────────────────────────────
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(5);
  nextMonth.setHours(14, 0, 0, 0);

  const meeting = await prisma.meeting.create({
    data: {
      chama_id: chama.id,
      scheduled_at: nextMonth,
      location: 'Java House, Kenyatta Avenue, Nairobi',
      agenda: JSON.stringify([
        { item: 'Review monthly financial statement', presenter: 'Omondi Otieno' },
        { item: 'Discuss new investment opportunities', presenter: 'Wanjiku Kamau' },
        { item: 'Member welfare updates', presenter: 'Njeri Mwangi' },
        { item: 'AOB', presenter: 'All' },
      ]),
      status: 'SCHEDULED',
    },
  });

  console.log(`  ✓ Created upcoming meeting: ${nextMonth.toLocaleDateString()}`);

  // ─── Create Fines ─────────────────────────────────────────────
  await prisma.fine.create({
    data: {
      chama_id: chama.id,
      member_id: memberOmondi.id,
      reason: 'Late contribution penalty - Cycle 2',
      amount: 200,
      paid: true,
    },
  });

  await prisma.fine.create({
    data: {
      chama_id: chama.id,
      member_id: memberNjeri.id,
      reason: 'Late contribution penalty - Cycle 4',
      amount: 200,
      paid: false,
    },
  });

  console.log('  ✓ Created 2 fines (1 paid, 1 unpaid)');

  // ─── Create Notifications ────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        user_id: wanjiku.id,
        chama_id: chama.id,
        message: 'Your contribution of KES 5,000 for May has been received. Thank you!',
        read: true,
      },
      {
        user_id: omondi.id,
        chama_id: chama.id,
        message: 'Reminder: Your contribution of KES 5,000 is due in 2 days.',
        read: false,
      },
      {
        user_id: omondi.id,
        chama_id: chama.id,
        message: 'Loan repayment of KES 11,000 is due on April 15, 2026.',
        read: false,
      },
      {
        user_id: njeri.id,
        chama_id: chama.id,
        message: 'You have an unpaid fine of KES 200. Please clear it.',
        read: false,
      },
      {
        user_id: wanjiku.id,
        chama_id: chama.id,
        message: 'Next meeting scheduled for ' + nextMonth.toLocaleDateString() + ' at Java House.',
        read: false,
      },
    ],
  });

  console.log('  ✓ Created 5 notifications');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📋 Test credentials:');
  console.log('   Phone: +254 712 345 678 (Wanjiku - Chairman)');
  console.log('   Phone: +254 723 456 789 (Omondi - Treasurer)');
  console.log('   Phone: +254 734 567 890 (Njeri - Secretary)');
  console.log('   PIN: 1234 (for all users)');
  console.log(`\n   Chama invite code: FAHARI2025`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
