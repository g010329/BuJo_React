import React from "react";
import db from "../firebase.js";
import {countWeekNum,handleValidation} from '../util.js';
import Calendar from "../Calendars/calendar";
import ChangeMonthCal from "../Calendars/changeMonthCal";

import EachDayToDos from "./eachDayToDos.js";
import ThisMonthToDos from "./thisMonthTodos.js";
import LogTitle from "./monthLogTitle.js";
// 有使用者的uid: this.props.uid

class RenderMonthLog extends React.Component{
    constructor(props){
        super(props);
        this.state={
            year: new Date().getFullYear(), //2020
            month: new Date().getMonth(), //7
            date: new Date().getDate(), //3
            day: new Date().getDay(), //五
            daysOfMonth: new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate(), //31
            thisMonthToDos:[
                // {"title":'add somthing todo',"index":1,"ifDone":false,"content":''}
            ],
            eachDayToDos:[
                // {date:1, 1號
                // day:0, 週幾
                // todos:[eat,sleep],
                // ifInput: false}, 當天事項
                // {date:0,
                // day:3,
                // todos:['eat','sleep'],
                // ifInput: false}
            ],
            reRender: false,
            ifInput: false,
            ifShowMore: false,
            note:"",
            moreInfoBoard:{
                id:'',
                oldTitle: '',
                newTitle: '',
                index: 0,
                innerIndex: null,
                content: null,
                iYear:null,
                iMonth:null,
                iDate:null,
                list:null
            },
            calenIfShow:false,
            ifChangeMonth:false,
            theme: this.props.theme
            
        };
        this.updateEachDayToDos = this.updateEachDayToDos.bind(this);
        this.handleMonthForward = this.handleMonthForward.bind(this);
        this.handleMonthBackward = this.handleMonthBackward.bind(this);
        this.addThisMonthToDos = this.addThisMonthToDos.bind(this);
        this.toggleIfInput = this.toggleIfInput.bind(this);
        this.showInput = this.showInput.bind(this);
        this.handleNoteChange = this.handleNoteChange.bind(this);
        // EachDate
        this.toggleEachDateIfInput = this.toggleEachDateIfInput.bind(this);
        this.showEachDateInput = this.showEachDateInput.bind(this);
        this.turnOffEachDayIfInput = this.turnOffEachDayIfInput.bind(this);
        this.addThisDayToDos = this.addThisDayToDos.bind(this);
        // DB
        this.addToDB = this.addToDB.bind(this);
        this.deleteInDB = this.deleteInDB.bind(this);
        this.getDBdataInState = this.getDBdataInState.bind(this);
        // moreinfo-adjust
        this.autoHeight = this.autoHeight.bind(this);
        this.showMoreInfo = this.showMoreInfo.bind(this);
        this.toggleIfShowMore = this.toggleIfShowMore.bind(this);
        this.adjustTodo = this.adjustTodo.bind(this);
        //ifDone
        this.ifDone = this.ifDone.bind(this);
        //calen
        this.showCalen = this.showCalen.bind(this);
        //下層的calen Component取得新時間後傳回上層
        this.calenUpdateTime = this.calenUpdateTime.bind(this);
        this.adjustTimeInDB = this.adjustTimeInDB.bind(this);
        this.ifChangeMonth = this.ifChangeMonth.bind(this);
        //today
        this.backToTodayBtn = this.backToTodayBtn.bind(this);
        //list
        this.chooseList = this.chooseList.bind(this);  
        // input required
        //outside
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }
    
    
    changeMonth(year,month){
        // console.log(year,month);
        this.setState(preState=>{
            let eachDayToDos = [];
            // this.getDBdataInState(month,year,0);
            for (let i=0; i<new Date(year,month+1,0).getDate(); i++){
                eachDayToDos.push({
                    date:i,
                    day:new Date(`${year}-${month+1}-${i+1}`).getDay(),
                    todos:[],
                    ifInput: false,
                    
                });
                this.getDBdataInState(month,year,i+1);
            }
            return{
                year:year,
                month:month,
                daysOfMonth:new Date(year,month+1,0).getDate(),
                eachDayToDos:eachDayToDos,
                ifChangeMonth:false
                
            }
        }, ()=>{
            this.getDBdataInState(month,year,0);
            for (let i=0; i<new Date(year,month+1,0).getDate(); i++){
                this.getDBdataInState(month,year,i+1);
            }
        });
    }
    ifChangeMonth(){
        this.setState(preState=>{
            let ifChangeMonth = !preState.ifChangeMonth;
            console.log('更換月');
            return{
                ifChangeMonth: ifChangeMonth
            }
        })
    }
    calenUpdateTime(year,month,date,week){
        console.log('calenUpdateTime',year,month,date,week);
        if(date<1){
            return;
        }
        if(date>new Date(year,month+1,0).getDate() && date!==999){
            return;
        }else{
            console.log('123');
            this.setState(preState=>{
                let moreInfoBoard = preState.moreInfoBoard;
                moreInfoBoard.iYear = year;
                moreInfoBoard.iMonth = month;
                moreInfoBoard.iDate = date;
                console.log(week,'999 表示點選的是週曆'); 
                if(week==999){
                    week = countWeekNum(new Date(`${year}-${month+1}-${date}`));
                    console.log('換算後的週數',week)
                    moreInfoBoard.iDate = 0;
                    moreInfoBoard.iWeek = week;
                }
                if(date==999){
                    console.log('表示在選擇月份')
                    moreInfoBoard.iDate = 0;
                    moreInfoBoard.iWeek = null
                }
                // moreInfoBoard.iWeek = week;
                console.log('calenUpdateTime',moreInfoBoard);
                return{
                    moreInfoBoard:moreInfoBoard,
                    calenIfShow:false
                } 
            })
        }
    }

    adjustTodo(){
        let oldTitle = this.state.moreInfoBoard.oldTitle;
        let note;
        // 該月
        if (this.state.moreInfoBoard.innerIndex == null){
            console.log('修改月未安排',this.state.moreInfoBoard);
            this.setState(preState=>{
                note = preState.note;
                let {moreInfoBoard, thisMonthToDos, eachDayToDos, ifShowMore} = preState;
                thisMonthToDos[moreInfoBoard.index].title = note;
                console.log('adjust month to do');
                console.log(eachDayToDos);
                return{
                    thisMonthToDos:thisMonthToDos,
                    ifShowMore:!ifShowMore,
                    calenIfShow:false,
                    eachDayToDos:eachDayToDos
                }
            });
            console.log(this.state.moreInfoBoard.id);
            let ref = db.collection("members").doc(this.props.uid).collection("todos");
            //沒改過時間的
            if (this.state.moreInfoBoard.iDate==null){
                console.log('沒改時間');
                ref.doc(this.state.moreInfoBoard.id).update({
                    title:this.state.note,
                    list: this.state.moreInfoBoard.list
                }).then(()=>{
                    this.getDBdataInState(this.state.month,this.state.year,0);
                    this.props.reRenderLog();
                })
                
            }else{
                console.log('改過時間','m',this.state.moreInfoBoard.iMonth,'year',this.state.moreInfoBoard.iYear,'date',this.state.moreInfoBoard.iDate,'week',this.state.moreInfoBoard.iWeek);
                ref.doc(this.state.moreInfoBoard.id).update({
                    title:this.state.note,
                    month:this.state.moreInfoBoard.iMonth,
                    year:this.state.moreInfoBoard.iYear,
                    date:this.state.moreInfoBoard.iDate,
                    week:this.state.moreInfoBoard.iWeek,
                    list: this.state.moreInfoBoard.list
                });
            }
            this.props.reRenderLog();
        }else{ //該月每天
            // console.log('adjust day to do');
            this.setState(preState=>{
                note = preState.note;
                let {moreInfoBoard, eachDayToDos, ifShowMore} = preState;
                eachDayToDos[moreInfoBoard.index].todos[moreInfoBoard.innerIndex].title = note;
                console.log('adjust month-day to do');
                if(moreInfoBoard.iMonth!=this.state.month){
                    eachDayToDos[moreInfoBoard.index].todos.splice(moreInfoBoard.index,1);
                }
                return{
                    eachDayToDos: eachDayToDos,
                    ifShowMore:!ifShowMore,
                    calenIfShow:false
                }
            });
            let ref = db.collection("members").doc(this.props.uid).collection("todos");
            ref.where("year","==",this.state.year).where("month","==",this.state.month).where("date","==",parseInt(this.state.moreInfoBoard.index)+1).where("title","==",this.state.moreInfoBoard.oldTitle)
                .get().then(querySnapshot=>{
                    querySnapshot.forEach(doc=>{
                        doc.ref.update({
                            title:this.state.note,
                            month:this.state.moreInfoBoard.iMonth,
                            year:this.state.moreInfoBoard.iYear,
                            date:this.state.moreInfoBoard.iDate,
                            list: this.state.moreInfoBoard.list
                        }).then(()=>{this.props.reRenderLog();})
                    })
                })
        }
    }
    toggleIfShowMore(e){
        let oldTitle = e.currentTarget.getAttribute("data-title");
        let index = e.currentTarget.getAttribute("data-index");
        let innerIndex = e.currentTarget.getAttribute("data-innerindex");
        let id = e.currentTarget.getAttribute("data-id");
        let list = e.currentTarget.getAttribute("data-list");
        this.setState(preState=>{
            let ifShowMore = preState.ifShowMore;
            let moreInfoBoard = preState.moreInfoBoard;
            moreInfoBoard.oldTitle = oldTitle;
            moreInfoBoard.index = index;
            moreInfoBoard.innerIndex = innerIndex;
            moreInfoBoard.id = id;
            moreInfoBoard.iYear = this.state.year;
            moreInfoBoard.iMonth = this.state.month;
            moreInfoBoard.list = list;
            console.log('toggleIfShowMore','index:',index,'inner:',innerIndex,moreInfoBoard);
            if(innerIndex==null){
                //月
                moreInfoBoard.iDate = 0;
                moreInfoBoard.iWeek = null;
                moreInfoBoard.list = list;
            }
            if (innerIndex!=null){
                //月-日
                moreInfoBoard.iDate = parseInt(index)+1;
                moreInfoBoard.iWeek = null;
                moreInfoBoard.list = list;
            }
            moreInfoBoard.calenType = 'month';
            return{
                ifShowMore: !ifShowMore,
                note : oldTitle,
                moreInfoBoard: moreInfoBoard,
                calenIfShow: false
            }
        })
    }
    chooseList(e){
        let list = e.target.value;
        console.log(e.target.value);
        this.setState(preState=>{
            let moreInfoBoard = preState.moreInfoBoard;
            moreInfoBoard.list = list;
            return{
                moreInfoBoard: moreInfoBoard
            }
        })
    }
    showCalen(){
        console.log('showCalen')
        this.setState(preState=>{
            let calenIfShow = !preState.calenIfShow;
            return{
                calenIfShow: calenIfShow
            }
        })
    }

    adjustTimeInDB(){
        let id = this.state.moreInfoBoard.id;
        console.log('adjustTimeInDB',this.state.moreInfoBoard.id,this.state.moreInfoBoard.iYear,this.state.moreInfoBoard.iMonth,this.state.moreInfoBoard.iDate);
        let ref = db.collection("members").doc(this.props.uid).collection("todos");
        ref.where("id","==",id)
            .get().then(querySnapshot=>{
                querySnapshot.forEach(doc=>{
                    console.log('adjustTimeInDB');
                    // console.log(doc.data());
                })
            })
    }

    showMoreInfo(){
        let selectList = this.props.listItems.map((list,index)=><option value={list.title} data-list={list.title} key={index}>{list.title}</option>)
        let showScheTime1 = <span className="littleCal popUp">{this.state.moreInfoBoard.iYear}-{this.state.moreInfoBoard.iMonth+1}</span>
        let showScheTime2 = <span className="littleCal popUp">{this.state.moreInfoBoard.iYear}-week{this.state.moreInfoBoard.iWeek}</span>
        let showScheTime3 = <span className="littleCal popUp">{this.state.moreInfoBoard.iYear}-{this.state.moreInfoBoard.iMonth+1}-{this.state.moreInfoBoard.iDate}</span>
        let {iMonth, iDate, iWeek, list} = this.state.moreInfoBoard;
        return(
            <div id="moreInfo" className="bt_moreInfo_board" data-enter={'info'} onKeyDown={this.enterClick}>
                <div className="infoflex">
                    <div className="info1">
                        <textarea  id="testHeight" className="info_titleInput" onChange={this.handleNoteChange} onInput={this.autoHeight} cols="15" rows="1" placeholder="Title"  defaultValue={this.state.moreInfoBoard.oldTitle} autoFocus></textarea>
                    </div>
                    <div className="info popUp" onClick={this.showCalen}>
                        <div className="infoLi popUp">
                            <i className="fas fa-calendar popUp"></i>
                            <span className="addList popUp">Change Time</span>
                        </div>
                        <div className="infoLi2 popUp" >
                            {iDate==0&&iWeek==null&&iMonth>=0? showScheTime1:''}
                            {iWeek!=null && iWeek!=0 && iDate==0? showScheTime2:''}
                            {((iWeek==0 || iWeek==undefined) && iDate>0)? showScheTime3:''}
                        </div>
                    </div>
                    <div className="info">
                        <div className="infoLi">
                            <i className="fas fa-list-ul"></i>
                            
                            <span className="addList">{this.state.moreInfoBoard.list==null?'Add To List':list}</span>
                        </div>
                        <div className="infoLi2">
                            <select className="selectList" onChange={this.chooseList}>
                                <option value="">Choose List</option>
                                {selectList}
                                <option value={null}>尚未選擇</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="infoBtns">
                    <span className="infoCancelBtn" onClick={this.toggleIfShowMore}>Cancel</span>
                    <span className="infoSaveBtn" id="saveMoreInfo" onClick={this.adjustTodo}>Save</span>
                </div>
            </div>
        )
    }
    
    addThisDayToDos(day){
        if(handleValidation(this.state.note)==true){
            let indexDay = day.currentTarget.getAttribute("data-addday");
            this.setState(preState=>{
                let {year, month, eachDayToDos} = preState;
                let date = parseInt(indexDay)+1;
                let thing = preState.note;
                eachDayToDos[indexDay].todos.push({title:thing});
                eachDayToDos[indexDay].ifInput = false;
                this.addToDB(thing, year, month, date, 0);
                this.props.reRenderLog();
                return{
                    eachDayToDos:eachDayToDos,
                    note:""
                }
            });
        }else{
            alert("Please Input Task")
            return;
        }
    }

    ifDone(e){
        // console.log(this.state.month);
        let index=e.currentTarget.getAttribute("data-index");
        let title=e.currentTarget.getAttribute("data-title");
        let newStatus;
        this.setState(preState=>{
            let thisMonthToDos = preState.thisMonthToDos;
            newStatus = !thisMonthToDos[index].ifDone;
            thisMonthToDos[index].ifDone = newStatus;
        });
        let ref = db.collection("members").doc(this.props.uid).collection("todos");
        ref.where("month","==",this.state.month).where("year","==",this.state.year).where("date","==",0).where("title","==",title)
            .get().then(querySnapshot=>{
                querySnapshot.forEach(doc=>{
                    // console.log(doc.id);
                    doc.ref.update({isDone:newStatus})
                })
            })
    }

    toggleEachDateIfInput(eachday){
        // 取得要新增事件的那一天index綁定在onClick上
        let index = eachday.currentTarget.getAttribute("data-addindex");
        this.setState(preState=>{
            let eachDayToDos = preState.eachDayToDos;
            let ifInput = preState.ifInput;
            eachDayToDos.map((eachday,index)=>{eachday.ifInput = false});
            eachDayToDos[index].ifInput = true;
            return {
                eachDayToDos: eachDayToDos,
                ifInput: false
            }
        });
    }



    addToDB(title,year,month,date,week){
        let ref = db.collection("members").doc(this.props.uid).collection("todos").doc();
        ref.set({
            title: title,
            year: year,
            // 存入DB的月份，假設七月，會顯示6
            month: month,
            date: date,
            week: week,
            type: "task",
            content: '',
            isDone: false,
            overdue: false           
        })
        .then(()=>{
            this.getDBdataInState(this.state.month,this.state.year,0);
        });
        // console.log('add');
    }

    getDBdataInState(month,year,date){
        let ref = db.collection("members").doc(this.props.uid).collection("todos");
        let thisMonthToDos = [];
        if(date == 0){
            ref.where('month','==',month).where('year','==',year).where('date','==',date).where('isDone','==',false)
                .get().then(querySnapshot => {
                    // console.log('getDBdataInState1',month,year,date);
                    querySnapshot.forEach(doc=>{
                        thisMonthToDos.push({
                            title: doc.data().title,
                            ifDone: doc.data().isDone,
                            id: doc.id,
                            list: doc.data().list
                        });
                    });
                    this.setState({
                        thisMonthToDos:thisMonthToDos
                    })
                });
        }else{
            ref.where('month','==',month).where('year','==',year).where('date','==',date).where('week','<',1).where('isDone','==',false)
                .get().then(querySnapshot => {
                    // console.log('getDBdataInState2',month,year,date);
                    querySnapshot.forEach(doc=>{
                        this.setState(preState=>{
                            let eachDayToDos = preState.eachDayToDos;
                            eachDayToDos[doc.data().date-1].todos=[];
                            eachDayToDos[doc.data().date-1].todos.push({
                                title:doc.data().title,
                                id:doc.id,
                                list: doc.data().list});
                            return{
                                eachDayToDos: eachDayToDos
                            }
                        });
                    });
                });
            ref.where('month','==',month).where('year','==',year).where('date','==',date).where('week','==',null).where('isDone','==',false)
            .get().then(querySnapshot => {
                // console.log('getDBdataInState2',month,year,date);
                querySnapshot.forEach(doc=>{
                    this.setState(preState=>{
                        let eachDayToDos = preState.eachDayToDos;
                        eachDayToDos[doc.data().date-1].todos=[];
                        eachDayToDos[doc.data().date-1].todos.push({
                            title:doc.data().title,
                            id:doc.id,
                            list: doc.data().list});
                        return{
                            eachDayToDos: eachDayToDos
                        }
                    });
                });
            });
        }
    }
    componentDidMount(){
        // console.log(this.state.theme);
        this.updateEachDayToDos();
        // 將該月未安排事件放入state
        this.getDBdataInState(this.state.month,this.state.year,0);
        document.addEventListener('click', this.handleClickOutside, false);
    }
    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, false);
    }
    handleClickOutside(event) {
        let cN = event.target.classList;
        if(cN.contains('popUp')){
            return;
        }else{
            this.setState({
                calenIfShow:false,
                ifChangeMonth:false
            })
        }
        
    }
    addThisMonthToDos(){
        if(handleValidation(this.state.note)==true){
            this.setState(preState=>{
                let thing = preState.note;
                let {year,month,thisMonthToDos,ifInput} = preState;
                thisMonthToDos.push({"title":thing,"index":thisMonthToDos.length,"ifDone":false});
                // 將該月未安排日期事項存入DB
                this.addToDB(thing, year, month, 0, 0);
                // console.log(list);
                this.props.reRenderLog();
                return{
                    thisMonthToDos:thisMonthToDos,
                    note:"",
                    ifInput:!ifInput
                };
                
            });
        }else{
            alert("Please Input Task")
            return;
        }
    }
    deleteInDB(bt){
        let deleteTitle = bt.currentTarget.getAttribute("data-title");
        let deleteIndex = bt.currentTarget.getAttribute("data-delete-index");
        let ref = db.collection("members").doc(this.props.uid).collection("todos");
        ref.where("month","==",this.state.month).where("year","==",this.state.year).where("title","==",deleteTitle)
            .get().then(querySnapshot=>{
                querySnapshot.forEach(doc=>{
                    doc.ref.update({isDone:true}).then(()=>{
                        this.props.reRenderLog();
                        this.getDBdataInState(this.state.month,this.state.year,0);
                    });
                })
            });
    }
    
    
    updateEachDayToDos(){
        this.setState(preState=>{
            let {year, month, daysOfMonth} = preState;
            let eachDayToDos =[];
            for (let i=0; i<daysOfMonth; i++){
                eachDayToDos.push({
                    date:i,
                    day:new Date(`${year}-${month+1}-${i+1}`).getDay(),
                    todos:[],
                    ifInput: false
                });
                
            }
            return{eachDayToDos:eachDayToDos}
        }, ()=>{
            let {year, month, daysOfMonth} = this.state;
            for (let i=0; i<daysOfMonth; i++){
                this.getDBdataInState(month,year,i+1);
            }
        });
    }
    
    turnOffEachDayIfInput(){
        this.setState(preState=>{
            let {eachDayToDos} = preState;
            eachDayToDos.map((eachday)=>{eachday.ifInput = false});
            return{
                eachDayToDos:eachDayToDos
            }
        })
    }
    showEachDateInput(i){
        return(
        <div className="month_todo addmd" data-enter={'month-date'} onKeyDown={this.enterClick}>
            <span>
                <input className="addmd_input" placeholder="ADD TASK" type="text" onChange={this.handleNoteChange} autoFocus/>
            </span>
            <span className="month_todo_feacture2">
                <span className="cancel" onClick={this.turnOffEachDayIfInput}>Cancel</span>
                <span className="add" id="inputMonthDate" data-addday={i} onClick={this.addThisDayToDos} >Add</span>
            </span>
        </div>
        )
    }

    backToTodayBtn(){
        console.log('回到今天');
        this.setState(preState=>{
            return{
                year: new Date().getFullYear(), 
                month: new Date().getMonth(), 
                date: new Date().getDate(),
            }
        })
        this.updateEachDayToDos();
        this.getDBdataInState(new Date().getMonth(),new Date().getFullYear(),0);
        // this.getDBdataInState(new Date().getMonth(),new Date().getFullYear(),new Date().getDate());
    }

    handleMonthForward(){
        this.setState(preState=>{
            let {year, month} = preState;
            if(month<11){
                return{
                    month: month+1,
                    daysOfMonth: new Date(year,month+2,0).getDate(),
                    eachDayToDos:[] //清空
                }
            }else{
                return{
                    year: year+1,
                    month: 0,
                    daysOfMonth: new Date(year+1,1,0).getDate(),
                    eachDayToDos:[] //清空
                }
            }
        }, ()=>{
            let {year, month} = this.state;
            this.getDBdataInState(month,year,0);
            this.updateEachDayToDos();
        });
    }
    handleMonthBackward(){
        this.setState(preState=>{
            let {year, month} = this.state;
            if(month==0){
                return{
                    year: year-1,
                    month: 11,
                    daysOfMonth: new Date(year-1,12,0).getDate(),
                    eachDayToDos:[] //清空
                }
            }else{
                return{
                    month: month-1,
                    daysOfMonth: new Date(year,month,0).getDate(),
                    eachDayToDos:[] //清空
                }
            }
        }, ()=>{
            let {year, month} = this.state;
            this.getDBdataInState(month,year,0);
            this.updateEachDayToDos();
        });
    }
    componentDidUpdate(preProps){
        if(preProps.reRender !== this.props.reRender){
            console.log("Month Update");
            this.updateEachDayToDos();
            this.getDBdataInState(this.state.month,this.state.year,0);
        }
        if(preProps.btToday !== this.props.btToday){
            this.backToTodayBtn();
            console.log("Month Update2");
        }
    }
    toggleIfInput(){
        this.setState(preState=>{
            let ifInput = preState.ifInput;
            ifInput = !ifInput;
            return{
                ifInput: ifInput
            }
        });
        this.turnOffEachDayIfInput();
    }
    handleNoteChange(e){
        this.setState({
            note:e.currentTarget.value
        });
    }
    showInput(){
        return(
        <div className="month_todo" data-enter={'month'} onKeyDown={this.enterClick}>
            <span>
                <input className="noScheInput"  type="text" placeholder="+ ADD MONTH TASK" onChange={this.handleNoteChange} autoFocus/>
            </span>
            <span className="month_todo_feacture2">
                <span className="cancel" onClick={this.toggleIfInput}>Cancel</span>
                <span className="add" id="inputMonth" onClick={this.addThisMonthToDos}>Add</span>
            </span>
        </div>
        )
    }
    
    

    autoHeight(){
        let x = document.getElementById("testHeight");
        x.style.height = 'auto';
        x.style.height = x.scrollHeight + "px";
    }
    enterClick(e){
        let btntype = e.currentTarget.getAttribute("data-enter");
        if (event.keyCode==13 && btntype=='month-date'){
            document.getElementById("inputMonthDate").click(); //觸動按鈕的點擊
        } 
        if (event.keyCode==13 && btntype=='month'){
            document.getElementById("inputMonth").click(); //觸動按鈕的點擊
        } 
        if (event.keyCode==13 && btntype=='info'){
            document.getElementById("saveMoreInfo").click(); //觸動按鈕的點擊
        } 
    }
    render(){
        let {year, month, date, theme, thisMonthToDos, eachDayToDos, ifInput, ifShowMore, calenIfShow, ifChangeMonth} = this.state;
        return <div id="month" className={`left_board left_board_${theme}`}>
            {/* 事件移動日期日曆 */}
            {calenIfShow?<Calendar calenUpdateTime={this.calenUpdateTime.bind(this)} year={year} month={month} date={date}/>:''}
            {/* 切換月份日曆 */}
            {ifChangeMonth?<ChangeMonthCal changeMonth={this.changeMonth.bind(this)}/>:''}
            {/* 月-標題 */}
            <LogTitle year={year} month={month} theme={theme} ifChangeMonth={this.ifChangeMonth.bind(this)} handleMonthBackward={this.handleMonthBackward.bind(this)} handleMonthForward={this.handleMonthForward.bind(this)} toggleIfInput={this.toggleIfInput.bind(this)}/>
            {/* 月-未安排事項 */}
            <ThisMonthToDos thisMonthToDos={thisMonthToDos} theme={theme} ifInput={ifInput} toggleIfShowMore={this.toggleIfShowMore.bind(this)} showInput={this.showInput.bind(this)} deleteInDB={this.deleteInDB.bind(this)}/>
            {/* 月-30天月曆 */}
            <EachDayToDos eachDayToDos={eachDayToDos} month={month} date={date} theme={theme} toggleEachDateIfInput={this.toggleEachDateIfInput.bind(this)} showEachDateInput={this.showEachDateInput.bind(this)} toggleIfShowMore={this.toggleIfShowMore.bind(this)}/>
            <div className="wbgc"></div>
            {/* 單一事件控制面板 */}
            {ifShowMore? this.showMoreInfo(): ''}
        </div>;
    }
}



export default RenderMonthLog;