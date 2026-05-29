import Link from 'next/link';

const content = {
  fr: {
    title: 'Politique de confidentialité',
    updated: 'Dernière mise à jour : mai 2026',
    sections: [
      {
        h: 'Responsable du traitement',
        p: 'GreenCollect Morocco (« nous ») traite vos données pour fournir le service de collecte de déchets recyclables à Casablanca.',
      },
      {
        h: 'Données collectées',
        p: 'Nom, e-mail, téléphone, adresses de collecte (coordonnées GPS), historique des demandes de collecte et paiements associés.',
      },
      {
        h: 'Finalités',
        p: 'Prise de rendez-vous, exécution des collectes, facturation, support client et obligations légales.',
      },
      {
        h: 'Base légale (Maroc — loi 09-08)',
        p: 'Exécution du contrat, consentement pour les communications marketing, et intérêt légitime pour la sécurité du service.',
      },
      {
        h: 'Conservation',
        p: 'Données conservées pendant la durée du compte puis 30 jours après suppression, sauf obligation légale contraire.',
      },
      {
        h: 'Vos droits',
        p: 'Accès, rectification, suppression et opposition : contact@greencollect.ma',
      },
      {
        h: 'Sous-traitants',
        p: 'Hébergement cloud, service e-mail (Resend), géocodage OpenStreetMap/Nominatim.',
      },
    ],
  },
  ar: {
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: مايو 2026',
    sections: [
      {
        h: 'المسؤول عن المعالجة',
        p: 'تعالج GreenCollect Morocco بياناتك لتقديم خدمة جمع النفايات القابلة لإعادة التدوير في الدار البيضاء.',
      },
      {
        h: 'البيانات المجمعة',
        p: 'الاسم، البريد الإلكتروني، الهاتف، عناوين الجمع (إحداثيات GPS)، سجل طلبات الجمع والمدفوعات.',
      },
      {
        h: 'الأغراض',
        p: 'حجز المواعيد، تنفيذ عمليات الجمع، الفوترة، دعم العملاء والالتزامات القانونية.',
      },
      {
        h: 'الأساس القانوني (المغرب — القانون 09-08)',
        p: 'تنفيذ العقد، الموافقة للاتصالات التسويقية، والمصلحة المشروعة لأمن الخدمة.',
      },
      {
        h: 'الاحتفاظ',
        p: 'تُحفظ البيانات طوال مدة الحساب ثم 30 يوماً بعد الحذف ما لم يقتضِ القانون خلاف ذلك.',
      },
      {
        h: 'حقوقك',
        p: 'الوصول والتصحيح والحذف والاعتراض: contact@greencollect.ma',
      },
      {
        h: 'المعالجون الفرعيون',
        p: 'استضافة سحابية، بريد إلكتروني (Resend)، تحديد المواقع OpenStreetMap/Nominatim.',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: May 2026',
    sections: [
      {
        h: 'Data controller',
        p: 'GreenCollect Morocco processes your data to provide recyclable waste collection in Casablanca.',
      },
      {
        h: 'Data collected',
        p: 'Name, email, phone, collection addresses (GPS), pickup history and related payments.',
      },
      {
        h: 'Purposes',
        p: 'Scheduling, collection operations, billing, support and legal compliance.',
      },
      {
        h: 'Legal basis (Morocco Law 09-08)',
        p: 'Contract performance, consent for marketing, legitimate interest for service security.',
      },
      {
        h: 'Retention',
        p: 'Data kept for account lifetime plus 30 days after deletion unless law requires otherwise.',
      },
      {
        h: 'Your rights',
        p: 'Access, rectification, deletion, objection: contact@greencollect.ma',
      },
      {
        h: 'Sub-processors',
        p: 'Cloud hosting, email (Resend), geocoding OpenStreetMap/Nominatim.',
      },
    ],
  },
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lang = (locale in content ? locale : 'fr') as keyof typeof content;
  const c = content[lang];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-8 prose prose-green">
        <Link href={`/${locale}`} className="text-green-600 text-sm no-underline">
          ← GreenCollect
        </Link>
        <h1 className="text-3xl font-bold mt-4">{c.title}</h1>
        <p className="text-sm text-gray-500">{c.updated}</p>
        {c.sections.map((s) => (
          <section key={s.h} className="mt-6">
            <h2 className="text-lg font-semibold">{s.h}</h2>
            <p className="text-gray-700">{s.p}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
