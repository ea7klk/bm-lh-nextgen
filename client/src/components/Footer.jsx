import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <div className="footer">
      <p>
        {t('home.footer.providedBy')}<br />
        {t('home.footer.cookies')}<br />
        {t('home.footer.sourceCode')}{' '}
        <a href="https://github.com/ea7klk/bm-lh-nextgen" target="_blank" rel="noopener noreferrer">
          {t('home.footer.sourceCodeLink')}
        </a>{' '}
        {t('home.footer.license')}<br />
        {t('home.footer.contact')}{' '}
        <a href="https://github.com/ea7klk/bm-lh-nextgen/issues" target="_blank" rel="noopener noreferrer">
          {t('home.footer.githubIssues')}
        </a>{' '}
        {t('home.footer.or')} volker at ea7klk dot es
      </p>
    </div>
  );
};

export default Footer;
