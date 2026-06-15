import React from 'react'

const FinancialCard = ({
    icon,
    label,
    value,
    additionalContent,
    borderColor = "",
    bgcolor = "bg-white",
}) => {
    <div className={`{bgColor} rounded-xl p-5 lg:-mx-2 lg:p-2 shadow-sm border hover:shadow-md
    boeder-gray-100 transition-all ${borderColor}`}>
        <div className='text-sm font-medium text-gray-500 gap-2 flex items-center'>
            {icon}
            {label}
        </div>
        <p className='text-2xl font-bold text-gray-600 mt-1'>{value}</p>
        {additionalContent}
    </div>
}

export default FinancialCard
