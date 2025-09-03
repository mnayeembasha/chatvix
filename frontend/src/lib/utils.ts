export const formatDate = (dateInput:string|Date) =>{
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    const months:string[] = [
        "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
    ];

    const month:string = months[date.getMonth()];
    const day:number = date.getDate();
    const year:number = date.getFullYear();


    // let hours:number = date.getHours();
    // hours = hours % 12;
    // hours = hours ? hours :12 ; //0=>12
    // const minutes:number = date.getMinutes();
    // const ampm:string = hours>=12 ? "PM":"AM";
    // const formattedMinutes:string = minutes < 10 ? `0${minutes}`:minutes.toString();
    // ${hours}.${formattedMinutes}${ampm}
    return `${month} ${day}, ${year}`;
}