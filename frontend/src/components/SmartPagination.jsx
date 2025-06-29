import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faAnglesLeft, faAnglesRight } from '@fortawesome/free-solid-svg-icons';

const SmartPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className = 'pagination',
  buttonClassName = 'pagination-button',
  activeClassName = 'active',
  maxVisiblePages = 5
}) => {
  
  if (totalPages <= 1) return null;

  const renderPageButton = (pageNum, isActive = false, isDisabled = false) => (
    <button
      key={pageNum}
      onClick={() => !isDisabled && onPageChange(pageNum)}
      className={`${buttonClassName} ${isActive ? activeClassName : ''}`}
      disabled={isDisabled}
    >
      {pageNum}
    </button>
  );

  const renderEllipsis = (key) => (
    <span key={key} className="pagination-ellipsis">...</span>
  );

  const getVisiblePages = () => {
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(renderPageButton(i, i === currentPage));
      }
      return pages;
    }

    pages.push(renderPageButton(1, currentPage === 1));

    let startPage, endPage;

    if (currentPage <= 3) {
      startPage = 2;
      endPage = Math.min(maxVisiblePages - 1, totalPages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(renderPageButton(i, i === currentPage));
      }

      if (endPage < totalPages - 1) {
        pages.push(renderEllipsis('end-ellipsis'));
      }
    } else if (currentPage >= totalPages - 2) {
      if (totalPages > maxVisiblePages) {
        pages.push(renderEllipsis('start-ellipsis'));
      }
      
      startPage = Math.max(totalPages - maxVisiblePages + 2, 2);
      endPage = totalPages - 1;
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(renderPageButton(i, i === currentPage));
      }
    } else {
      pages.push(renderEllipsis('start-ellipsis'));
      
      startPage = currentPage - 1;
      endPage = currentPage + 1;
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(renderPageButton(i, i === currentPage));
      }
      
      pages.push(renderEllipsis('end-ellipsis'));
    }

    if (totalPages > 1) {
      pages.push(renderPageButton(totalPages, currentPage === totalPages));
    }

    return pages;
  };

  return (
    <div className={className}>
      <button 
        onClick={() => onPageChange(1)}
        className={buttonClassName}
        disabled={currentPage === 1}
        title="Primera página"
      >
        <FontAwesomeIcon icon={faAnglesLeft} /> Primera
      </button>
      
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        className={buttonClassName}
        disabled={currentPage === 1}
        title="Página anterior"
      >
        <FontAwesomeIcon icon={faAngleLeft} /> Anterior
      </button>
      
      {getVisiblePages()}
      
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        className={buttonClassName}
        disabled={currentPage === totalPages}
        title="Página siguiente"
      >
        Siguiente <FontAwesomeIcon icon={faAngleRight} />
      </button>
      
      <button 
        onClick={() => onPageChange(totalPages)}
        className={buttonClassName}
        disabled={currentPage === totalPages}
        title="Última página"
      >
        Última <FontAwesomeIcon icon={faAnglesRight} />
      </button>
    </div>
  );
};

export default SmartPagination;